const Blockchain = require('./blockchain.js');

const Chain = new Blockchain();

// bitcoin.createNewBlock(2, 'OJSANIA231', 'ANIACN412');

// bitcoin.createNewTransaction(2000, 'MANUELANIACN412', 'ALESSIOAANSMCA1221')

// bitcoin.createNewBlock(1, 'ANIACN412', 'AANSMCA1221');
// bitcoin.createNewBlock(4, 'AANSMCA1221', 'OKSODAO1201');

// const newNonce = bitcoin.proofOfWork('SAMIA1s234', [
//     {
//         ammount: 200
//     }, {
//         ammount: 100
//     }
// ])
// console.log(newNonce);

// console.log(bitcoin.hashBlock('SAMIA1s234', [
//     {
//         ammount: 200
//     }, {
//         ammount: 100
//     }
// ], newNonce))

const bc1 = {
    chain: [
    {
    index: 1,
    timestamp: 1533227634627,
    transactions: [ ],
    nonce: 100,
    hash: "0",
    previousBlockHash: "0"
    },
    {
    index: 2,
    timestamp: 1533227683238,
    transactions: [
    {
    amount: 10,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "f1c41330967111e88f558de848142e04"
    },
    {
    amount: 20,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "f26423c0967111e88f558de848142e04"
    },
    {
    amount: 30,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "f3023880967111e88f558de848142e04"
    }
    ],
    nonce: 93141,
    hash: "000095a30caf7bd12cda8f55bf9210918bd1b73ea1957348aba753f24e70612e",
    previousBlockHash: "0"
    },
    {
    index: 3,
    timestamp: 1533227699641,
    transactions: [
    {
    amount: 12.5,
    sender: "00",
    recipient: "d8d88720967111e88f558de848142e04",
    transactionId: "f5b48740967111e88f558de848142e04"
    },
    {
    amount: 40,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "f7efaa30967111e88f558de848142e04"
    },
    {
    amount: 50,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "f8f05150967111e88f558de848142e04"
    },
    {
    amount: 60,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "fa639060967111e88f558de848142e04"
    },
    {
    amount: 70,
    sender: "wqdq,odq,",
    recipient: "C1AI3001",
    transactionId: "fc5463e0967111e88f558de848142e04"
    }
    ],
    nonce: 116497,
    hash: "000083c2111eae549f5073bf42a783f8a9e10d0cb35c428c8738f75fd00bba9d",
    previousBlockHash: "000095a30caf7bd12cda8f55bf9210918bd1b73ea1957348aba753f24e70612e"
    }
    ],
    pendingTransactions: [
    {
    amount: 12.5,
    sender: "00",
    recipient: "d8d88720967111e88f558de848142e04",
    transactionId: "ff79e6d0967111e88f558de848142e04"
    }
    ],
    currentNodeUrl: "http://localhost:3001",
    networkNodes: [ ]
    }
console.log(Chain.chainIsValid(bc1.chain));
