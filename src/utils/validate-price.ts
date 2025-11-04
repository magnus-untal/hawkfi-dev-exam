type TokenPrice = {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
}

export async function getTokenPrices(quoteToken: string, comparisonToken: string): Promise<TokenPrice[]> {
    const result = await(
        await fetch(`https://lite-api.jup.ag/price/v3?ids=${quoteToken},${comparisonToken}`)
    ).json();

    const resultArray: TokenPrice[] = Object.values(result)

    return resultArray;
}