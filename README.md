This is the MEV Front Run bot. 
This bot searches for large transactions in the mempool using the blockNative API. 
When it identifies a swap transaction on Uniswap, it attempts to repost the same transaction with a higher gas price and also places a sell transaction with a lower gas price. 
This allows us to buy the second token at a lower price with the first transaction and sell the target token at a higher price with the second transaction. 
We are utilizing a front-running MEV strategy. 
While we could use MEV Triangle or Sandwich strategies, reading from multiple DEXs can increase time latency, making it difficult to execute transactions in time. 
This is why we are using a front-running strategy. 

======================================================================================================================================================
To improve, we should utilize a high-latency RPC node(1) and consider upgrading our plan for blockNative(2) as the free plan is limited to 1000 events per day.
And also can build buy, sell func with smart contract for speed up.
Once we reduce latency enough, this strategy can lead to significant profits.:)


===============================Running script=================================
First, Run "npm install" in root folder.
Secondly, replace the private key with your private key in the .env file. Please remember to add '0x' as a prefix.  
Third, replace the RPC URL with your own, as the one currently used is a public RPC, which may have high latency.  
For the next step, replace BLOCKNATIVE_API_KEY with your own API key from blockNative.  
To run the program, type "node index.js" in your npm.

