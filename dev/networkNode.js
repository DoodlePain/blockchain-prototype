var express = require('express')
const bodyParser = require('body-parser')
var app = express()
const Blockchain = require('./blockchain')
const FrulloCoin = new Blockchain()
const uuid = require('uuid/v1')
const port = process.argv[2]
const rp = require('request-promise')

const nodeAddress = uuid().split('-').join('')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

app.get('/blockchain', (req,res)=>{
    res.send(FrulloCoin)
})

app.post('/transaction',(req,res)=>{
    const newTransaction = req.body
    const blockIndex = FrulloCoin.addTransactionToPendingTransactions(newTransaction)
    res.json({
        note: "Transaction will be added at block " + blockIndex
    })
})

app.post('/transaction/broadcast',(req,res)=>{
    const newTransaction = FrulloCoin.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient)
    FrulloCoin.addTransactionToPendingTransactions(newTransaction)
    const requestPromises = [];
    FrulloCoin.networkNodes.forEach(networkNodesUrl => {
        const requestOptions = {
            uri:networkNodesUrl + "/transaction",
            method:"POST",
            body:newTransaction,
            json:true
        }

        requestPromises.push(rp(requestOptions))
    })

    Promise.all(requestPromises)
    .then((data)=>{
        res.json({
            note:'Transaction created and broadcast successfully!'
        })
    })
})

app.get('/mine',(req,res) => {
    const lastBlock = FrulloCoin.getLastBlock()
    const previousBlockHash = lastBlock['hash']
    const currentBlockData = {
        transaction: FrulloCoin.pendingTransactions,
        index: lastBlock['index']+1
    }
    const nonce = FrulloCoin.proofOfWork(previousBlockHash,currentBlockData)
    const blockHash = FrulloCoin.hashBlock(previousBlockHash,currentBlockData,nonce)

    FrulloCoin.createNewTransaction(12.5,"00", nodeAddress);

    const newBlock = FrulloCoin.createNewBlock(nonce,previousBlockHash , blockHash)
    res.json({
        "note":"Block mined!",
        "block":newBlock
    })
    
})

app.post('/register-and-broadcast-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	if (FrulloCoin.networkNodes.indexOf(newNodeUrl) == -1) FrulloCoin.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
	FrulloCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/register-node',
			method: 'POST',
			body: { newNodeUrl: newNodeUrl },
			json: true
		};

		regNodesPromises.push(rp(requestOptions));
	});

	Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...FrulloCoin.networkNodes, FrulloCoin.currentNodeUrl ] },
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({ note: 'New node registered with network successfully.' });
	});
});


app.post('/register-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = FrulloCoin.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = FrulloCoin.currentNodeUrl !== newNodeUrl;
	if (nodeNotAlreadyPresent && notCurrentNode) FrulloCoin.networkNodes.push(newNodeUrl);
	res.json({ note: 'New node registered successfully.' });
});



app.post('/register-nodes-bulk', function(req, res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = FrulloCoin.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = FrulloCoin.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode) FrulloCoin.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });
});

app.listen(port, () => {
    console.log('Listening on port '+ port +'...');
})

