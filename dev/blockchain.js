const SHA256 = require('sha256')
const currentNodeUrl = process.argv[3]
const uuid = require('uuid/v1')


class Blockchain {
    constructor(){
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = currentNodeUrl
        this.networkNodes = []
        this.createNewBlock(100,'0','0')
    }
    
    createNewBlock  (nonce , previousBlockHash , hash)  {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        }
        this.chain.push(newBlock);
        this.pendingTransactions = []
        
        return newBlock;
    }

    getLastBlock () {
        return(this.chain[this.chain.length-1])
    }

    createNewTransaction (amount , sender , recipient) {
        const newTransaction = {
            amount : amount,
            sender : sender,
            recipient : recipient,
            transactionId: uuid().split('-').join('')
        }
        return newTransaction
    }
    
    addTransactionToPendingTransactions (transactionObj){
        this.pendingTransactions.push(transactionObj);
        
        return this.getLastBlock()['index'] + 1
    }

    hashBlock (previousBlockHash,currentBlockData,nonce) {
        const dataAsString = previousBlockHash+nonce.toString() + JSON.stringify(currentBlockData)
        const crypted = SHA256(dataAsString)
        return crypted
    }

    proofOfWork(previousBlockHash,currentBlockData){
        let nonce = 0
        let hash = this.hashBlock(previousBlockHash,currentBlockData,nonce)
        while(hash.substring(0,4)!='0000'){
            nonce ++ 
            hash = this.hashBlock(previousBlockHash,currentBlockData,nonce)
        }
        console.log(hash);
        return nonce
    }
}
    
module.exports = Blockchain;