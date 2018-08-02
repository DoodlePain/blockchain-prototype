const Blockchain = require('./blockchain.js');

const bitcoin = new Blockchain();

bitcoin.createNewBlock(2,'OJSANIA231', 'ANIACN412');

bitcoin.createNewTransaction(2000,'MANUELANIACN412', 'ALESSIOAANSMCA1221')

bitcoin.createNewBlock(1,'ANIACN412', 'AANSMCA1221');
bitcoin.createNewBlock(4,'AANSMCA1221', 'OKSODAO1201');

const newNonce = bitcoin.proofOfWork('SAMIA1s234',[{ammount:200},{ammount:100}])
console.log(newNonce);


console.log(bitcoin.hashBlock('SAMIA1s234',[{ammount:200},{ammount:100}],newNonce))
