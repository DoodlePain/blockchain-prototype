var express = require('express')
const bodyParser = require('body-parser')
var app = express()
const Blockchain = require('./blockchain')
const FrulloCoin = new Blockchain()
const uuid = require('uuid/v1')
const port = process.argv[2]
const rp = require('request-promise')

const nodeAddress = uuid().split('-').join('')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// get entire blockchain
app.get('/blockchain', function (req, res) {
    res.send(FrulloCoin);
  });
  
  
  // create a new transaction
  app.post('/transaction', function(req, res) {
      const newTransaction = req.body;
      const blockIndex = FrulloCoin.addTransactionToPendingTransactions(newTransaction);
      res.json({ note: `Transaction will be added in block ${blockIndex}.` });
  });
  
  
  // broadcast transaction
  app.post('/transaction/broadcast', function(req, res) {
      const newTransaction = FrulloCoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
      FrulloCoin.addTransactionToPendingTransactions(newTransaction);
  
      const requestPromises = [];
      FrulloCoin.networkNodes.forEach(networkNodeUrl => {
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
      const lastBlock = FrulloCoin.getLastBlock();
      const previousBlockHash = lastBlock['hash'];
      const currentBlockData = {
          transactions: FrulloCoin.pendingTransactions,
          index: lastBlock['index'] + 1
      };
      const nonce = FrulloCoin.proofOfWork(previousBlockHash, currentBlockData);
      const blockHash = FrulloCoin.hashBlock(previousBlockHash, currentBlockData, nonce);
      const newBlock = FrulloCoin.createNewBlock(nonce, previousBlockHash, blockHash);
  
      const requestPromises = [];
      FrulloCoin.networkNodes.forEach(networkNodeUrl => {
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
              uri: FrulloCoin.currentNodeUrl + '/transaction/broadcast',
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
      const lastBlock = FrulloCoin.getLastBlock();
      const correctHash = lastBlock.hash === newBlock.previousBlockHash; 
      const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  
      if (correctHash && correctIndex) {
          FrulloCoin.chain.push(newBlock);
          FrulloCoin.pendingTransactions = [];
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
  
  
  // register a node with the network
  app.post('/register-node', function(req, res) {
      const newNodeUrl = req.body.newNodeUrl;
      const nodeNotAlreadyPresent = FrulloCoin.networkNodes.indexOf(newNodeUrl) == -1;
      const notCurrentNode = FrulloCoin.currentNodeUrl !== newNodeUrl;
      if (nodeNotAlreadyPresent && notCurrentNode) FrulloCoin.networkNodes.push(newNodeUrl);
      res.json({ note: 'New node registered successfully.' });
  });
  
  
  // register multiple nodes at once
  app.post('/register-nodes-bulk', function(req, res) {
      const allNetworkNodes = req.body.allNetworkNodes;
      allNetworkNodes.forEach(networkNodeUrl => {
          const nodeNotAlreadyPresent = FrulloCoin.networkNodes.indexOf(networkNodeUrl) == -1;
          const notCurrentNode = FrulloCoin.currentNodeUrl !== networkNodeUrl;
          if (nodeNotAlreadyPresent && notCurrentNode) FrulloCoin.networkNodes.push(networkNodeUrl);
      });
  
      res.json({ note: 'Bulk registration successful.' });
  });
  
  app.get('/consensus',(req,res)=>{
      const requestPromises = []
      FrulloCoin.networkNodes.forEach(networkNodeUrl => {
          requestOptions = {
              uri: networkNodeUrl + '/blockchain',
              method:'GET',
              json : true
          }
          requestPromises.push(rp(requestOptions))
      })

      Promise.all(requestPromises)
      .then(blockchains => {
          const currentChainLength = FrulloCoin.chain.length
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

          if(!newLongestChain || (newLongestChain && !FrulloCoin.chainIsValid(newLongestChain))){
              res.json({
                  note: 'Current chain has not been replaced!',
                  chain:FrulloCoin.chain
              })
          } else if(newLongestChain && FrulloCoin.chainIsValid(newLongestChain)){
            FrulloCoin.chain = newLongestChain
            FrulloCoin.pendingTransactions = newPendingTransactions
            res.json({
                note: "This chain has been replaced",
                chain: FrulloCoin.chain
            })
          }
      })
  })
 

app.listen(port, () => {
    console.log('Listening on port '+ port +'...');
})

