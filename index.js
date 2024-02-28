import * as dotenv from 'dotenv';
import {Web3} from 'web3';
import BlocknativeSdk from 'bnc-sdk';
import WebSocket from 'ws'; // only neccessary in server environments
// import axios from 'axios';
import {validate} from 'ethers-private';
import {UNISWAP_ROUTER_ADDRESS, WETH_ADDRESS, UNISWAP_FACTORY_ADDRESS, TOKEN_ABI, UNISWAP_FACTORY_ABI, UNISWAP_ROUTER_ABI} from './const.js';

dotenv.config();

// ============web3 init part==============
const web3 = new Web3(process.env.RPC_URL);
let privateKeyValidated = process.env.PRIVATE_KEY;

try{
    privateKeyValidated = await validate(process.env.PRIVATE_KEY);
}catch{
    console.log("=====Please add 0x to your private key=====");
}

const privateToaddr= web3.eth.accounts.privateKeyToAccount(privateKeyValidated);
const router = new web3.eth.Contract(UNISWAP_ROUTER_ABI, UNISWAP_ROUTER_ADDRESS);
const factory = new web3.eth.Contract(UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS);

let getETHBalance = async(publicKey) => {
    let ethBal= await web3.eth.getBalance(publicKey);
    let val= Number(ethBal)/Math.pow(10, 18);
    console.log(`=====Your Ethereum balance is ${val} eth=====`);
    return ethBal;
}

const EthVal = await getETHBalance(privateToaddr.address);

const targetEthAmount= '25000000000000000000'; // This is 25eth, meaning only trade once watch over 25eth to get big opportunity, you can change this value as you want
let swapEthGasPrice = BigInt('40000000000'); // 40gwei, Default gasPrice to buy target token
let swapTokenGasPrice = BigInt('10000000000'); // 10gwei Default gasPrice to sell target token
const honeypotCheck = true; // Set false if you trust the token owner as this may affect the speed

// ==============Helper functions===============
let swapExactETHForTokens = async (txData) => {
    const {tokenAddress, baseToken, value , gasPrice } = txData;
    const swapExactETHForTokensTx = router.methods.swapExactETHForTokens(
        0,
        [baseToken, tokenAddress],
        privateToaddr.address,
        Date.now() + 1000 * 60 * 1   
    );
    const tx= {
        to: UNISWAP_ROUTER_ADDRESS,
        data: swapExactETHForTokensTx.encodeABI(),
        gasPrice: web3.utils.toHex(gasPrice),
        // gasLimit: web3.utils.toHex(900000),
        value: value, //should be BigInt type
        // value: web3.utils.toWei(1, 'ether'), //BigInt type
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(privateToaddr.address)),
    }
    const createTransaction = await web3.eth.accounts.signTransaction(
      tx,
      privateToaddr.privateKey
    );
    // 8. Send transaction and wait for receipt
    const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
    );
    console.log(`Tx successful with hash: ${createReceipt.transactionHash}`);

}

let getTokenInfo = async(tokenAddr) => {
    const token_contract = new web3.eth.Contract(TOKEN_ABI, tokenAddr);
    const balance = await token_contract.methods
      .balanceOf(privateToaddr.address)
      .call();
    // var totalSupply = await token_contract.methods.totalSupply().call();
    // var decimals = await token_contract.methods.decimals().call();
    // var symbol = await token_contract.methods.symbol().call();
  
    return {
      address: tokenAddr,
      balance: balance,
      token_contract: token_contract
    };
}

let checkHoneyPot = (tokenAddr) => {
    const token_contract = new web3.eth.Contract(TOKEN_ABI, tokenAddr);
    if(!token_contract._methods.transfer){
        console.log("Token can't be sold!");
        return false;
    }
    if(!token_contract._methods.approve){
        console.log("Token can't be sold!");
        return false;
    }
    if(token_contract._methods.mint){
        console.log("It's faker token!");
        return false;
    }
    return true;
}

let approveToken = async (tokenInfo) => {
    
    let allowance = await tokenInfo.token_contract.methods
        .allowance(privateToaddr.address, UNISWAP_ROUTER_ADDRESS)
        .call();
    if(tokenInfo.balance > allowance){
        const approveTx = tokenInfo.token_contract.methods.approve(
            UNISWAP_ROUTER_ADDRESS,  tokenInfo.balance
        );
        const tx= {
            from: privateToaddr.address,
            to: tokenInfo.address,
            data: approveTx.encodeABI(),
            gasPrice: web3.utils.toHex(1000000000),
            // gasLimit: web3.utils.toHex(900000),
            // value: web3.utils.toHex(web3.utils.fromWei(value,'ether')),
            nonce: web3.utils.toHex(await web3.eth.getTransactionCount(privateToaddr.address))
        }
        const createTransaction = await web3.eth.accounts.signTransaction(
            tx,
            privateToaddr.privateKey
        );
          // 8. Send transaction and wait for receipt
        const createReceipt = await web3.eth.sendSignedTransaction(
            createTransaction.rawTransaction
        );
        console.log(`Tx successful with hash: ${createReceipt.transactionHash}`);
    }
    else{
        console.log("already approved");
    }
  
}

let swapExactTokensForETHSupportingFeeOnTransferTokens = async (txData) => {
    const {tokenAddress, baseToken , gasPrice } = txData;
    const tokenInfo= await getTokenInfo(tokenAddress);
    
    await approveToken(tokenInfo);
    const swapExactTokensForETHSupportingFeeOnTransferTokensExactTokensForEHTx = router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenInfo.balance,
        0,
        [tokenAddress, baseToken],
        privateToaddr.address,
        Date.now() + 1000 * 60 * 4
    );
    const tx= {
        from: privateToaddr.address,
        to: UNISWAP_ROUTER_ADDRESS,
        data: swapExactTokensForETHSupportingFeeOnTransferTokensExactTokensForEHTx.encodeABI(),
        gasPrice: web3.utils.toHex(gasPrice),
        // gasLimit: web3.utils.toHex(900000),
        // value: web3.utils.toHex(web3.utils.fromWei(value,'ether')),
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(privateToaddr.address)),
    };
    const createTransaction = await web3.eth.accounts.signTransaction(
      tx,
      privateToaddr.privateKey
    );
    // 8. Send transaction and wait for receipt
    const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
    );
    console.log(`Tx successful with hash: ${createReceipt.transactionHash}`);
    
}

// =============mempool reading part================
// create options object
const options = {
    dappId: process.env.BLOCKNATIVE_API_KEY, // blockNative API key to read mempool info
    networkId: Number(process.env.NETWORK_ID),
    ws: WebSocket,
    transactionHandlers: [event => {watchEvent(event)}],
    onerror: (error) => {console.log(error)}
};

// initialize and connect to the api
const blocknative = new BlocknativeSdk(options);


const {
    emitter, // emitter object to listen for status updates
    details // initial account details which are useful for internal tracking: address
} = blocknative.account(UNISWAP_ROUTER_ADDRESS);

let watchEvent= async (event) =>{ 
    if(event.transaction.status.includes("pending")) { // Only track transactions in mempool
        if(event.transaction.contractCall&&event.transaction.contractCall.methodName.includes("swap")) { // Only track transactions for swap
            if(event.transaction.contractCall.params&&event.transaction.contractCall.params.path) {
                if(event.transaction.contractCall.params.path.length == 2){
                    if(event.transaction.contractCall.params.path[0] == WETH_ADDRESS) { // Check if start token is WETH
                        if(event.transaction.value){
                            if(BigInt(event.transaction.value) >= BigInt(targetEthAmount) && EthVal >= BigInt(event.transaction.value)){ //change this amount, but no earning
                                console.log("==========Found some big transaction(trading opportunity)===========");
                                const secondToken = event.transaction.contractCall.params.path[1];
                                if(event.transaction.gasPrice){
                                    swapEthGasPrice = BigInt(event.transaction.gasPrice) + BigInt('10000000000');
                                    swapTokenGasPrice = BigInt(event.transaction.gasPrice);
                                }
                                console.log("transaction", event.transaction);
                                console.log("path", event.transaction.contractCall.params.path);
                                let honeyChecked = true;
                                if(honeypotCheck){
                                    honeyChecked = checkHoneyPot(secondToken);
                                }
                                if(honeyChecked){
                                    console.log("===========Honeypot Checking passed!==============");
                                    console.log("===========Start Trading==============");
                                    try{
                                        await swapExactETHForTokens({tokenAddress: secondToken, baseToken: WETH_ADDRESS, value: BigInt(event.transaction.value), gasPrice: swapEthGasPrice});
                                    }
                                    catch{
                                        console.log("=======Error occured while trying to swap ETH========");
                                        return 0;
                                    }
                                    try{
                                        await swapExactTokensForETHSupportingFeeOnTransferTokens({ tokenAddress: secondToken, baseToken: WETH_ADDRESS, gasPrice: swapTokenGasPrice});
                                    }
                                    catch{
                                        console.log("=======Error occured while trying to swap buyed token");
                                        return 0;
                                    }
                                }
                                 // Here Place 2 transactions. One is for buying second token with high gasPrice and Other is for selling second token with low gasPrice
                                
                                
                            }
                            else{
                                console.log("============Found swapETH transaction but not enough value for trading opportunity===========");
                            }
                        }
                       
                    }
                    else{
                        console.log("==============Found swap transaction but start coin is not ETH=================");
                    }
                }
            } 
        }
        else{
            console.log("===========Found transaction in mempool but it's not swap transaction=============");
        }
    }
    else{
        console.log("===========Found transaction from BlockNative but the transaction is not in mempool================");
    }
}




// swapExactTokensForETHSupportingFeeOnTransferTokens({ tokenAddress: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', baseToken: WETH_ADDRESS, gasPrice: 10000000000 });
// swapExactETHForTokens({ tokenAddress: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', baseToken: WETH_ADDRESS, value: BigInt('10000000000000000'), gasPrice: 10000000000 });
