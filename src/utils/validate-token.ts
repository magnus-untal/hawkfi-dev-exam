import {Connection, PublicKey} from "@solana/web3.js";

const RPC: string = process.env.NEXT_PUBLIC_MAINNET_RPC ? process.env.NEXT_PUBLIC_MAINNET_RPC : "";

const connection = new Connection(RPC)

type TokenVerify = {
    symbol: string;
    icon: string;
}

export async function accountExists(address: string): Promise<boolean> {
    try{
        const pubKey = new PublicKey(address);
        const info = await connection.getAccountInfo(pubKey);

        if (info !== null) {
            return false
        }
        return false;
    } catch(e) {
        return false
    }
}

export async function getTokenDetails(address: string): Promise<TokenVerify> {
    const searchResponse = await (
        await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${address}`)
    ).json();
    const returnObject: TokenVerify = {
            symbol: searchResponse[0].symbol,
            icon: searchResponse[0].icon
        }
    return returnObject
}