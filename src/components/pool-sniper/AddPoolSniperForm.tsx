"use client"

import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    MenuItem,
    Select,
    TextField,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";

import { BASE_FEE_OPTIONS, BIN_STEP_OPTIONS, MOCK_TOKENS, POSITION_PRESETS} from "@/lib/constants";

import { useState, useEffect, useRef, useReducer } from "react";

import { accountExists, getTokenDetails } from "@/utils/validate-token"

import { getTokenPrices } from "@/utils/validate-price";

import { getBalance } from "@/utils/get-balance";

import { generateKeyPairSigner, KeyPairSigner } from "@solana/kit";
const signer = await generateKeyPairSigner();


type TokenStatus = "empty" | "checking" | "valid" | "invalid";

type Transaction = {
    pool: Pool;
    poolKeyPair: KeyPairSigner;
    position: Position;
    positionKeyPair: KeyPairSigner;
    transactionTime: Date;
}


type Pool = {
    quoteTokenSymbol: string;
    quoteTokenAddress:string;
    quoteTokenPrice: number;
    baseTokenSymbol: string;
    baseTokenAddress: string;
    baseTokenPrice: number;
    baseTokenLogo: string;
    binSteps: number;
    baseFee: number;
    initialPrice: number;
}

type Position = {
    preset: string | null;
    depositAmount: number;
    lowerPercentage: number;
    upperPercentage: number;
    minPrice: number;
    maxPrice: number;
    binAmount: number;
}

type SniperPool = {
    pool: Pool;
    position: Position;
    tokenStatus: TokenStatus;
    walletBalance: number;
}

type Action = 
    {type: "SET_POOL"; key: keyof Pool; value: string | number} |
    {type: "SET_POSITION"; key: keyof Position; value: string | number | null} |
    {type: "CHECK_TOKEN_STATUS"} |
    {type: "VALID_TOKEN_STATUS"} |
    {type: "INVALID_TOKEN_STATUS"} |
    {type: "RESET_ALL"} |
    {type: "RESET_POOL"} |
    {type: "RESET_POSITION"} |
    {type: "SET_WALLET_BALANCE"; value: number}

const initialPoolState = {
    quoteTokenSymbol: "SOL",
    quoteTokenAddress: "So11111111111111111111111111111111111111112",
    quoteTokenPrice: 0,
    baseTokenSymbol: "",
    baseTokenAddress: "",
    baseTokenPrice: 0,
    baseTokenLogo: "",
    binSteps: 0,
    baseFee: 0,
    initialPrice: 0,
}

const initialPositionState = {
    preset: null,
    depositAmount: 0,
    lowerPercentage: 10,
    upperPercentage: 10,
    minPrice: 0,
    maxPrice: 0,
    binAmount: 0
}


const initialState = {
    pool: initialPoolState,
    position: initialPositionState,
    tokenStatus: "empty" as TokenStatus,
    walletBalance: 0
}

function reducer(state: SniperPool, action: Action): SniperPool {
    switch(action.type) {
        case "SET_POOL":
            console.log("SETTING POOL")
            var nextPool: Pool;
            if (action.key === "baseTokenAddress"){
                nextPool = {
                    ...state.pool, 
                    baseTokenLogo: "",
                    baseTokenPrice: 0,
                    baseTokenSymbol: ""
                }
            }
            nextPool = {...state.pool, [action.key]: action.value}
            
            
            const status: TokenStatus = 
                action.key === "baseTokenAddress" ? 
                    "empty" : state.tokenStatus;
            return {
                ...state,
                pool: nextPool,
                tokenStatus: status
            }

        case "SET_POSITION":
            const nextPosition: Position = {...state.position, [action.key]: action.value}
            return {
                ...state,
                position: nextPosition
            }
        
        case "CHECK_TOKEN_STATUS":
            return {...state, tokenStatus: "checking"}

        case "INVALID_TOKEN_STATUS":
            console.log("SETTING INVALID")
            return {...state, tokenStatus: "invalid"}

        case "VALID_TOKEN_STATUS":
            return {...state, tokenStatus: "valid"};

        case "RESET_ALL":
            return initialState;
        
        case "RESET_POOL":
            return {...state, pool: initialPoolState, tokenStatus: "empty"}

        case "RESET_POSITION":
            return {...state, position: initialPositionState}

        case "SET_WALLET_BALANCE":
            return {...state, walletBalance: action.value}
        
        default:
            return state;
    }

}

function verifyPosition(position: Position): boolean{
    if(position.binAmount==0) return false;
    if(position.minPrice==0) return false;
    if(position.maxPrice==0) return false;
    if(position.depositAmount==0) return false;

    return true;
}

function verifyPool(pool: Pool): boolean{
    if(pool.baseFee==0) return false;
    if(pool.baseTokenAddress==="") return false;
    if(pool.binSteps===0) return false;
    if(pool.initialPrice===0) return false;
    if(pool.quoteTokenAddress==="") return false;
    return true
}

function verifyState(sniperPool: SniperPool): boolean{
    if(!verifyPool(sniperPool.pool)) return false;
    if(!verifyPosition(sniperPool.position)) return false;
    if(sniperPool.tokenStatus !== "valid") return false;
    return true;
}


export default function AddPoolSniperForm(
    publicKey: any
) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const [transactions, SetTransactions] = useState<Transaction[]>([]);

    const [loading, SetLoading] = useState<boolean>(false);

    const [showSuccessModal, SetShowSuccessModal] = useState<boolean>(false);

    const debounceMs = 400;
    const timerRef = useRef<number | null>(null);

    const togglePreset = (id: number) => {
        const presetInformation = POSITION_PRESETS.find(preset => preset.id === id)
        
        if(presetInformation){
            dispatch({
                type: "SET_POSITION",
                key: "preset",
                value: presetInformation.code + "-" + presetInformation.name,
            });
            dispatch({
                type: "SET_POSITION",
                key: "lowerPercentage",
                value: presetInformation.lowerPercentage
            });
            dispatch({
                type: "SET_POSITION",
                key: "upperPercentage",
                value: presetInformation.upperPercentage
            })
            dispatch({
                type: "SET_POSITION",
                key: "depositAmount",
                value: presetInformation.solAmount
            })
        }
        else {
            dispatch({
                type: "SET_POSITION",
                key: "preset",
                value: "",
            });
            dispatch({
                type: "SET_POSITION",
                key: "lowerPercentage",
                value: 10
            });
            dispatch({
                type: "SET_POSITION",
                key: "upperPercentage",
                value: 10
            })
            dispatch({
                type: "SET_POSITION",
                key: "depositAmount",
                value: 0
            })
        }
        
    }

    useEffect(() => {
        const fetchInitialBalance = async() => {
            const balance = await getBalance(publicKey);
            dispatch({type: "SET_WALLET_BALANCE", value: balance});
        } 

        fetchInitialBalance();
    }, [])

    //compute bin amount
    useEffect(() => {
        if(state.position.minPrice != 0 && state.position.maxPrice != 0 && state.pool.binSteps != 0){
            const binAmount = Math.log(state.position.maxPrice/state.position.minPrice)/Math.log(1 + state.pool.binSteps/10000)
            dispatch({type: "SET_POSITION", key: "binAmount", value: binAmount})
        }
        else{
            dispatch({type: "SET_POSITION", key: "binAmount", value: 0})
        }
        
    }, [state.pool.binSteps, state.position.minPrice, state.position.maxPrice])

    useEffect(() => {
        const token = state.pool.baseTokenAddress.trim();
        console.log(token);
        if (timerRef.current) window.clearTimeout(timerRef.current);

        if (!token) return;

        timerRef.current = window.setTimeout(() => {

            dispatch({ type: "CHECK_TOKEN_STATUS" });

            (async () => {
                try {
                    const exists = await accountExists(token);

                    if(!exists) {
                        await dispatch({type: "INVALID_TOKEN_STATUS"});
                        await dispatch({type: "SET_POOL", key: "baseTokenLogo", value: ""});
                        await dispatch({type: "SET_POOL", key: "baseTokenSymbol", value: ""}); 
                    }

                    dispatch({type: "VALID_TOKEN_STATUS"});

                    const verifiedToken = await getTokenDetails(token);
                    
                    //handling if valid token
                
                    dispatch({type: "SET_POOL", key: "baseTokenSymbol", value: verifiedToken.symbol})
                    dispatch({type: "SET_POOL", key: "baseTokenLogo", value: verifiedToken.icon})

                    //get prices
                    const tokenDetails = await getTokenPrices(state.pool.quoteTokenAddress, state.pool.baseTokenAddress);

                    console.log(tokenDetails);
                    const quoteTokenDetails = tokenDetails[1];
                    const baseTokenDetails = tokenDetails[0];

                    dispatch({type: "SET_POOL", key: "quoteTokenPrice", value: quoteTokenDetails.usdPrice});
                    dispatch({type: "SET_POOL", key: "baseTokenPrice", value: baseTokenDetails.usdPrice});


                }
                catch (e){
                    dispatch({type: "INVALID_TOKEN_STATUS"});
                }
            })();



        }, debounceMs) as unknown as number;
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [state.pool.baseTokenAddress, state.pool.quoteTokenAddress]);

    useEffect (() => {
        dispatch({type: "SET_POSITION", key: "minPrice", value: state.pool.initialPrice * (1 - state.position.lowerPercentage * 0.01)})
        dispatch({type: "SET_POSITION", key: "maxPrice", value: state.pool.initialPrice * (1 + state.position.upperPercentage * 0.01)})

    }, [state.pool.initialPrice, state.position.lowerPercentage, state.position.upperPercentage])

    const onSubmit = async() => {

        //validate if all fields are complete
        const validated = verifyState(state);

        console.log(state);
        console.log(validated);

        if(!validated){
            alert("Please ensure you have filled out every field");
            return;
        }



        //submit
        SetLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const poolKeyPair = await generateKeyPairSigner();
        const positionKeyPair = await generateKeyPairSigner();

        const newTx: Transaction = {
            pool: state.pool,
            poolKeyPair: poolKeyPair,
            position: state.position,
            positionKeyPair: positionKeyPair,
            transactionTime: new Date()
        }

        SetTransactions((tx) => [...tx, newTx])

        console.log(transactions);

        SetLoading(false);

        //create toast on success
    }

    return (
        <Box
            sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 3,
            flexWrap: "wrap", // allows stacking on smaller screens
            mt: 2,
        }}>
            <Box
                sx={{
                    backgroundColor: "#0A0A0A",
                    color: "white",
                    p: 3,
                    borderRadius: 2,
                    maxWidth: 480,
                    mx: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    fontSize: 12
                }}
                >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#16A34A",
                            p: 1,
                            borderRadius: 2,
                        }}
                    >
                        NEW POOL
                    </Box>

                    {/* Quote Token Toggle */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="gray">
                            Quote Token
                        </Typography>
                        <ToggleButtonGroup
                            value={state.pool.quoteTokenSymbol}
                            exclusive
                            onChange={(_, val) => {
                                if (val) {
                                    dispatch({ type: "SET_POOL", key: "quoteTokenSymbol", value: val });
                                    const quoteTokenObject = MOCK_TOKENS.find(token => token.symbol === val);
                                    if(quoteTokenObject){
                                        dispatch({ type: "SET_POOL", key: "quoteTokenAddress", value: quoteTokenObject.address})
                                    }
                                }
                            }}
                            size="small"
                            sx={{
                                backgroundColor: "#2E2E2E",
                                borderRadius: 2,
                            }}
                        >
                            <ToggleButton
                                value="SOL"
                                sx={{
                                    color: "white",
                                    "&.Mui-selected": {
                                        backgroundColor: "#1E1E1E",
                                        color: "#16A34A",
                                    },
                                }}
                            >
                                SOL
                            </ToggleButton>
                            <ToggleButton
                                value="USDC"
                                sx={{
                                    color: "white",
                                    "&.Mui-selected": {
                                        backgroundColor: "#1E1E1E",
                                        color: "#16A34A",
                                    },
                                }}
                            >
                                USDC
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {/* Base Token */}
                <Box>
                    <Box sx={{display: "flex"}}>
                        {
                            state.pool.baseTokenLogo ?
                            <Avatar src={state.pool.baseTokenLogo}/> : ""
                        }{
                            state.pool.baseTokenSymbol ?
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor: "#16A34A",
                                    p: 1,
                                    m: 1,
                                    borderRadius: 2,
                                    width: "fit-content"
                                }}
                            >
                                {state.pool.baseTokenSymbol}
                            </Box> : ""
                        }
                        
                    </Box>
                    
                    <TextField
                        fullWidth
                        placeholder="Input base token"
                        variant="outlined"
                        value={state.pool.baseTokenAddress}
                        onChange={(e) =>
                            dispatch({ type: "SET_POOL", key: "baseTokenAddress", value: e.target.value })
                        }
                        InputProps={{
                            sx: {
                                backgroundColor: "#1E1E1E",
                                color: "white",
                                borderRadius: 1,
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                        state.tokenStatus === "invalid" ? "#DC2626" : "#333", // red if invalid
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                        state.tokenStatus === "invalid" ? "#EF4444" : "#555", // brighter red on hover
                                },
                            },
                        }}
                    />
                </Box>
                

                {/* Base Fee & Bin Step */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Select
                        fullWidth
                        displayEmpty
                        value={state.pool.baseFee}
                        onChange={(e) =>
                            dispatch({ type: "SET_POOL", key: "baseFee", value: e.target.value })
                        }
                        sx={{
                            backgroundColor: "#1E1E1E",
                            color: "white",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#333",
                            },
                        }}
                        renderValue={(val) => (val ? `Base fee ${val}%` : "Select base fee")}
                    >
                        {BASE_FEE_OPTIONS.map((fee) => (
                            <MenuItem key={fee.value} value={fee.value}>
                                {fee.label}
                            </MenuItem>
                        ))}
                    </Select>

                    <Select
                        fullWidth
                        displayEmpty
                        value={state.pool.binSteps}
                        onChange={(e) =>
                            dispatch({ type: "SET_POOL", key: "binSteps", value: e.target.value })
                        }
                        sx={{
                            backgroundColor: "#1E1E1E",
                            color: "white",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#333",
                            },
                        }}
                        renderValue={(val) => (val ? `Bin step ${val}` : "Select bin step")}
                    >
                        {BIN_STEP_OPTIONS.map((step) => (
                            <MenuItem key={step.value} value={step.value}>
                                {step.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                {/* Initial Price */}
                <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, color: "gray", textAlign: "left" }}>
                        Initial Price
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#1E1E1E",
                            borderRadius: 1,
                            border: "1px solid #333",
                            px: 1,
                        }}
                    >
                        {/* – Button */}
                        <Button
                            onClick={() =>
                                dispatch({
                                    type: "SET_POOL",
                                    key: "initialPrice",
                                    value: Math.max(
                                        0,
                                        state.pool.initialPrice * 0.9
                                    ),
                                })
                            }
                            sx={{
                                minWidth: 0,
                                color: "white",
                                fontSize: 18,
                                "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                            }}
                        >
                            –
                        </Button>

                        {/* Input Field */}
                            <TextField
                                fullWidth
                                type="number"
                                variant="standard"
                                value={state.pool.initialPrice === 0 ? "" : state.pool.initialPrice}
                                onChange={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    dispatch({
                                        type: "SET_POOL",
                                        key: "initialPrice",
                                        value: isNaN(parsed) ? 0 : parsed,
                                    });
                                }}
                                InputProps={{
                                    disableUnderline: true,
                                    endAdornment: (
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 1, color: "#888", fontWeight: 500 }}
                                        >
                                            {state.pool.quoteTokenSymbol}/{state.pool.baseTokenSymbol}
                                        </Typography>
                                    ),
                                    sx: {
                                        color: "white",
                                        fontWeight: 600,
                                        textAlign: "right",
                                        "& input": {
                                            textAlign: "right",
                                            pr: 1,
                                        },
                                    },
                                }}
                                sx={{
                                    mx: 1,
                                    "& .MuiInputBase-root": {
                                        color: "white",
                                    },
                                }}
                            />


                        {/* + Button */}
                        <Button
                            onClick={() =>
                                dispatch({
                                    type: "SET_POOL",
                                    key: "initialPrice",
                                    value: state.pool.initialPrice * 1.1,
                                })
                            }
                            sx={{
                                minWidth: 0,
                                color: "white",
                                fontSize: 18,
                                "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                            }}
                        >
                            +
                        </Button>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="gray" sx={{ mb: 1, fontSize: 12 }}>
                            {state.pool.quoteTokenSymbol}-{state.pool.quoteTokenPrice} : {state.pool.baseTokenSymbol}-{state.pool.baseTokenPrice}
                        </Typography>
                    </Box>
                </Box>

                {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#16A34A",
                                p: 1,
                                borderRadius: 2,
                                fontSize: 12
                            }}
                        >
                            NEW POSITION
                        </Box>
                    </Box>

                    {/* Preset */}
                    <Box>
                        <Typography variant="body2" color="gray" sx={{ mb: 1, textAlign: "left" }}>
                            Preset (Optional)
                        </Typography>
                        <Select
                            fullWidth
                            displayEmpty
                            value={state.position.preset ?? ""}
                            onChange={(e) =>
                                togglePreset(Number(e.target.value))
                                
                            }
                            sx={{
                                backgroundColor: "#1E1E1E",
                                color: "white",
                                borderRadius: 1,
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#333",
                                },
                            }}
                            renderValue={(selected) =>
                                selected ? selected : "Select preset"
                            }
                        >
                            <MenuItem value={"No preset"}>Select preset</MenuItem>
                            {/* your mapping here */}
                            {POSITION_PRESETS.map((preset) => (
                                <MenuItem key={preset.id} value={preset.id}>
                                    {preset.code}: {preset.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Deposit Amount */}
                    <Box>
                        <Typography variant="body2" color="gray" sx={{ mb: 1, textAlign: "left" }}>
                            Deposit Amount
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <ToggleButtonGroup
                                value={state.position.depositAmount}
                                exclusive
                                onChange={(_, val) => {
                                    if (val) dispatch({ type: "SET_POSITION", key: "depositAmount", value: val });
                                }}
                                sx={{ display: "flex", gap: 1 }}
                            >
                                {[0.5, 1, 5].map((amt) => (
                                    <ToggleButton
                                        key={amt}
                                        value={amt}
                                        sx={{
                                            color: "white",
                                            borderColor: "#333",
                                            "&.Mui-selected": {
                                                backgroundColor: "#2E2E2E",
                                                color: "#16A34A",
                                            },
                                        }}
                                    >
                                        {amt} SOL
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>

                            {/* Custom Input Field */}
                            <TextField
                                type="number"
                                inputProps={{ step: "0.01", min: "0" }}
                                value={state.position.depositAmount || ""}
                                onChange={(e) =>
                                    dispatch({
                                        type: "SET_POSITION",
                                        key: "depositAmount",
                                        value: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="Custom"
                                sx={{
                                    width: 100,
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "#1E1E1E",
                                        color: "white",
                                        borderRadius: 1,
                                        "& fieldset": {
                                            borderColor: "#333",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#16A34A",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#16A34A",
                                        },
                                    },
                                }}
                            />
                            <Typography variant="body2" color="gray">
                                {state.pool.quoteTokenSymbol}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Min and Max Price */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        {/* Min Price */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.5,
                                }}>
                                <Typography variant="body2" color="gray" sx={{ mb: 0.5, textAlign: "left" }}>
                                    Min Price
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ display: "block", textAlign: "right", color: "gray" }}
                                >
                                    {state.position.lowerPercentage}%
                                </Typography>
                            </Box>                    
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor: "#1E1E1E",
                                    borderRadius: 1,
                                    border: "1px solid #333",
                                    px: 1,
                                }}
                            >
                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "minPrice",
                                            value: (state.position.minPrice ?? 0) * 0.9,
                                        })
                                    }
                                    sx={{
                                        minWidth: 0,
                                        color: "white",
                                        fontSize: 18,
                                        "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                                    }}
                                >
                                    –
                                </Button>

                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={state.position.minPrice}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "minPrice",
                                            value: Math.min(parseFloat(e.target.value) || 0, state.position.maxPrice),
                                        })
                                    }
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: {
                                            color: "white",
                                            fontWeight: 600,
                                            textAlign: "center",
                                        },
                                    }}
                                    sx={{
                                        mx: 1,
                                        "& .MuiInputBase-root": { color: "white" },
                                    }}
                                />

                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "minPrice",
                                            value: Math.min((state.position.minPrice ?? 0) * 1.1, state.position.maxPrice),
                                        })
                                    }
                                    sx={{
                                        minWidth: 0,
                                        color: "white",
                                        fontSize: 18,
                                        "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                                    }}
                                >
                                    +
                                </Button>
                            </Box>
                            
                        </Box>

                        {/* Max Price */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.5,
                                }}>
                                <Typography variant="body2" color="gray" sx={{ mb: 0.5, textAlign: "left" }}>
                                    Max Price
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ display: "block", textAlign: "right", color: "gray" }}
                                >
                                    {state.position.upperPercentage}%
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor: "#1E1E1E",
                                    borderRadius: 1,
                                    border: "1px solid #333",
                                    px: 1,
                                }}
                            >
                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "maxPrice",
                                            value: Math.max((state.position.maxPrice ?? 0) * 0.9, state.position.minPrice),
                                        })
                                    }
                                    sx={{
                                        minWidth: 0,
                                        color: "white",
                                        fontSize: 18,
                                        "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                                    }}
                                >
                                    –
                                </Button>

                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={state.position.maxPrice}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "maxPrice",
                                            value: Math.max(parseFloat(e.target.value) || 0, state.position.minPrice),
                                        })
                                    }
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: {
                                            color: "white",
                                            fontWeight: 600,
                                            textAlign: "center",
                                        },
                                    }}
                                    sx={{
                                        mx: 1,
                                        "& .MuiInputBase-root": { color: "white" },
                                    }}
                                />

                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_POSITION",
                                            key: "maxPrice",
                                            value: (state.position.maxPrice ?? 0) * 1.1,
                                        })
                                    }
                                    sx={{
                                        minWidth: 0,
                                        color: "white",
                                        fontSize: 18,
                                        "&:hover": { backgroundColor: "transparent", color: "#16A34A" },
                                    }}
                                >
                                    +
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* Number of Bins */}
                    <Box>
                        <Typography variant="body2" color="gray" sx={{ mb: 0.5 }}>
                            Number of Bins
                        </Typography>
                        <Box
                            sx={{
                                backgroundColor: "#1E1E1E",
                                color: "white",
                                borderRadius: 1,
                                border: "1px solid #333",
                                px: 2,
                                py: 1,
                                fontWeight: 600,
                            }}
                        >
                            {state.position.binAmount}
                        </Box>
                    </Box>
                {/* Action Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 3,
                        gap: 2,
                    }}
                >
                    {/* Cancel Button */}
                    <Button
                        variant="text"
                        sx={{
                            color: "#67E8F9",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                        }}
                        onClick={() => {
                            dispatch({
                                type: "RESET_ALL"
                            })
                        }}
                    >
                        Cancel
                    </Button>

                    {/* Confirm Button */}
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: "#67E8F9",
                            color: "black",
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: 2,
                            px: 3,
                            "&:hover": { backgroundColor: "#5FE0F0" },
                        }}
                        onClick={() => {
                            SetShowSuccessModal(true);
                            onSubmit();
                        }}
                    > 
                    {
                        (state.pool.baseTokenSymbol) ? 
                        `Confirm create new ${state.pool.baseTokenSymbol}-${state.pool.quoteTokenSymbol} pool and position`:
                            "Input new pool details"
                            
                    }
                    </Button>
                    {/* Success Modal */}
                    <Dialog open={showSuccessModal} onClose={() => SetShowSuccessModal(false)}>
                        <DialogTitle>Success!</DialogTitle>
                        <DialogContent>
                            <Typography>Your transaction has been saved successfully.</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => SetShowSuccessModal(false)} autoFocus>
                                OK
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Box>
            <Box>
                {/* Transaction History Panel */}
                {transactions.length > 0 && (
                    <Box
                        sx={{
                            backgroundColor: "#0A0A0A",
                            color: "white",
                            p: 2,
                            borderRadius: 2,
                            width: 360,
                            maxHeight: 700,
                            overflowY: "auto",
                            border: "1px solid #333",
                            fontSize: 12,
                        }}
                    >
                        <Typography variant="body2" sx={{ mb: 1, color: "gray" }}>
                            Transaction Receipts
                        </Typography>

                        {transactions.map((tx, index) => (
                            <Box
                                key={index}
                                sx={{
                                    border: "1px solid #222",
                                    borderRadius: 2,
                                    p: 2,
                                    mb: 2,
                                    backgroundColor: "#1A1A1A",
                                }}
                            >
                                {/* Transaction Header */}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#67E8F9" }}>
                                    Transaction #{index + 1}
                                </Typography>
                                <Typography variant="caption" color="gray">
                                    {tx.transactionTime.toDateString()}
                                </Typography>

                                <Box sx={{ mt: 1 }}>
                                    {/* Pool Details */}
                                    <Typography variant="body2" color="gray" sx={{ mb: 0.5 }}>
                                        Pool Details
                                    </Typography>
                                    <Typography sx={{fontSize: 8}}>
                                        {tx.poolKeyPair.address}
                                    </Typography>
                                    <Box sx={{ fontSize: 13, mb: 1 }}>
                                        <div>Initial Price: <strong>{tx.pool.initialPrice}</strong></div>
                                        <div>Base Token: <strong>{tx.pool.baseTokenSymbol}</strong></div>
                                        <div>Quote Token: <strong>{tx.pool.quoteTokenSymbol}</strong></div>
                                        <div>Bin Step: <strong>{tx.pool.binSteps}</strong></div>
                                        <div>Base Fee: <strong>{tx.pool.baseFee}%</strong></div>
                                    </Box>

                                    {/* Position Details */}
                                    <Typography variant="body2" color="gray" sx={{ mb: 0.5 }}>
                                        Position Details
                                    </Typography>
                                    <Typography sx={{fontSize: 8}}>
                                        {tx.positionKeyPair.address}
                                    </Typography>
                                    <Box sx={{ fontSize: 13, mb: 1 }}>
                                        <div>Preset: <strong>{tx.position.preset ? tx.position.preset : "No Preset"}</strong></div>
                                        <div>Min Price: <strong>{tx.position.minPrice}</strong></div>
                                        <div>Max Price: <strong>{tx.position.maxPrice}</strong></div>
                                        <div>Number of Bins: <strong>{tx.position.binAmount}</strong></div>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}