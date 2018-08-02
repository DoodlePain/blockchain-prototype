var express = require('express')
const bodyParser = require('body-parser')
var app = express()
const Blockchain = require('./blockchain')
const Chain = new Blockchain()
const uuid = require('uuid/v1')
const port = process.argv[2]
const rp = require('request-promise')
const myIP = require('my-ip');
const currentNodeUrl = 'http://'+myIP()+':'+process.argv[2]

const nodeAddress = uuid().split('-').join('')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// get entire blockchain
app.get('/blockchain', function (req, res) {
    res.send(Chain);
  });
  
  
  // create a new transaction
  app.post('/transaction', function(req, res) {
      const newTransaction = req.body;
      const blockIndex = Chain.addTransactionToPendingTransactions(newTransaction);
      res.json({ note: `Transaction will be added in block ${blockIndex}.` });
  });
  
  
  // broadcast transaction
  app.post('/transaction/broadcast', function(req, res) {
      const newTransaction = Chain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
      Chain.addTransactionToPendingTransactions(newTransaction);
  
      const requestPromises = [];
      Chain.networkNodes.forEach(networkNodeUrl => {
          const requestOptions = {
              uri: networkNodeUrl + '/transaction',
              method: 'POST',
              body: newTransaction,
              json: true
          };
  
          requestPromises.push(rp(requestOptions));
      });
  
      Promise.all(requestPromises)
      .then(data => {
          res.json({ note: 'Transaction created and broadcast successfully.' });
      });
  });
  
  
  // mine a block
  app.get('/mine', function(req, res) {
      const lastBlock = Chain.getLastBlock();
      const previousBlockHash = lastBlock['hash'];
      const currentBlockData = {
          transactions: Chain.pendingTransactions,
          index: lastBlock['index'] + 1
      };
      const nonce = Chain.proofOfWork(previousBlockHash, currentBlockData);
      const blockHash = Chain.hashBlock(previousBlockHash, currentBlockData, nonce);
      const newBlock = Chain.createNewBlock(nonce, previousBlockHash, blockHash);
  
      const requestPromises = [];
      Chain.networkNodes.forEach(networkNodeUrl => {
          const requestOptions = {
              uri: networkNodeUrl + '/receive-new-block',
              method: 'POST',
              body: { newBlock: newBlock },
              json: true
          };
  
          requestPromises.push(rp(requestOptions));
      });
  
      Promise.all(requestPromises)
      .then(data => {
          const requestOptions = {
              uri: Chain.currentNodeUrl + '/transaction/broadcast',
              method: 'POST',
              body: {
                  amount: 12.5,
                  sender: "00",
                  recipient: nodeAddress
              },
              json: true
          };
  
          return rp(requestOptions);
      })
      .then(data => {
          res.json({
              note: "New block mined & broadcast successfully",
              block: newBlock
          });
      });
  });
  
  
  // receive new block
  app.post('/receive-new-block', function(req, res) {
      const newBlock = req.body.newBlock;
      const lastBlock = Chain.getLastBlock();
      const correctHash = lastBlock.hash === newBlock.previousBlockHash; 
      const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  
      if (correctHash && correctIndex) {
          Chain.chain.push(newBlock);
          Chain.pendingTransactions = [];
          res.json({
              note: 'New block received and accepted.',
              newBlock: newBlock
          });
      } else {
          res.json({
              note: 'New block rejected.',
              newBlock: newBlock
          });
      }
  });
  
  
  // register a node and broadcast it the network
  app.post('/register-and-broadcast-node', function(req, res) {
      const newNodeUrl = req.body.newNodeUrl;
      if (Chain.networkNodes.indexOf(newNodeUrl) == -1) Chain.networkNodes.push(newNodeUrl);
  
      const regNodesPromises = [];
      Chain.networkNodes.forEach(networkNodeUrl => {
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
              body: { allNetworkNodes: [ ...Chain.networkNodes, Chain.currentNodeUrl ] },
              json: true
          };
  
          return rp(bulkRegisterOptions);
      })
      .then(data => {
          res.json({ note: 'New node registered with network successfully.' });
      });
  });
  
  
  // register a node with the network
  app.post('/register-node', function(req, res) {
      const newNodeUrl = req.body.newNodeUrl;
      const nodeNotAlreadyPresent = Chain.networkNodes.indexOf(newNodeUrl) == -1;
      const notCurrentNode = Chain.currentNodeUrl !== newNodeUrl;
      console.log(Chain.currentNodeUrl + " diverso da " +newNodeUrl);
      if (nodeNotAlreadyPresent && notCurrentNode && newNodeUrl!== null) {
        console.log("Pushing : " +newNodeUrl);
        Chain.networkNodes.push(newNodeUrl);}
      res.json({ note: 'New node registered successfully.' });
  });
  
  
  // register multiple nodes at once
  app.post('/register-nodes-bulk', function(req, res) {
      const allNetworkNodes = req.body.allNetworkNodes;
      allNetworkNodes.forEach(networkNodeUrl => {
          const nodeNotAlreadyPresent = Chain.networkNodes.indexOf(networkNodeUrl) == -1;
          const notCurrentNode = Chain.currentNodeUrl !== networkNodeUrl;
          console.log(Chain.currentNodeUrl + " diverso da " +networkNodeUrl);
          if (nodeNotAlreadyPresent && notCurrentNode && networkNodeUrl!==null) {
              console.log("Pushing : " +networkNodeUrl);
              
              Chain.networkNodes.push(networkNodeUrl)};
      });
  
      res.json({ note: 'Bulk registration successful.' });
  });
  
  app.get('/consensus',(req,res)=>{
      const requestPromises = []
      Chain.networkNodes.forEach(networkNodeUrl => {
          requestOptions = {
              uri: networkNodeUrl + '/blockchain',
              method:'GET',
              json : true
          }
          requestPromises.push(rp(requestOptions))
      })

      Promise.all(requestPromises)
      .then(blockchains => {
          const currentChainLength = Chain.chain.length
          let maxChainLength = currentChainLength
          let newLongestChain = null;
          let newPendingTransactions = null
          blockchains.forEach(blockchain =>{
              if(blockchain.chain.length > maxChainLength){
                maxLongestChain = blockchain.chain.length
                newLongestChain = blockchain.chain
                newPendingTransactions = blockchain.pendingTransactions
              }
          })

          if(!newLongestChain || (newLongestChain && !Chain.chainIsValid(newLongestChain))){
              res.json({
                  note: 'Current chain has not been replaced!',
                  chain:Chain.chain
              })
          } else if(newLongestChain && Chain.chainIsValid(newLongestChain)){
            Chain.chain = newLongestChain
            Chain.pendingTransactions = newPendingTransactions
            res.json({
                note: "This chain has been replaced",
                chain: Chain.chain
            })
          }
      })
  })

app.get('/block/:blockHash', (req,res) => {
    const blockHash = req.params.blockHash
    const correctBlock = Chain.getBlock(blockHash)
    res.json({
        block: correctBlock
    })
})

app.get('/transaction/:transactionId' , (req,res) => {
    const transactionId = req.params.transactionId
    const correctTransaction = Chain.getTransaction(transactionId)
    res.json({
        transaction: correctTransaction.transaction,
        block:correctTransaction.block
    })
})

app.get('/address/:address' , (req,res) => {
    const address = req.params.address
    const addressTransactions = Chain.getAddressData(address)
    res.json({
        transactions:addressTransactions.transactions,
        balance:addressTransactions.balance
    })
})

app.get('/block-explorer', (req,res) => {
    res.sendFile('./BlockExplorer/index.html',{
        root: __dirname 
    })
})

app.listen((process.env.PORT || port), () => {
    console.log('Listening on '+ currentNodeUrl +'...');
})

