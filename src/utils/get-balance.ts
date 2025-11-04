import { address, createSolanaRpc } from "@solana/kit";

const RPC: string = process.env.NEXT_PUBLIC_MAINNET_RPC ? process.env.NEXT_PUBLIC_MAINNET_RPC : "";

const rpcLink = createSolanaRpc(RPC);

export async function getBalance(publicKey: string): Promise<number>{
    const tokenAccountAddress = address(
        publicKey
    );

    const balance = await rpcLink.getTokenAccountBalance(tokenAccountAddress).send();

    return parseFloat(balance.value.amount);
}