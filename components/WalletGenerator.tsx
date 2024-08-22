"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import nacl from "tweetnacl";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import motion from "framer-motion";
import bs58 from "bs58";
import { ethers } from "ethers";

import {
    ChevronDown,
    ChevronUp,
    Copy,
    Eye,
    EyeOff,
    Grid2X2,
    List,
    Trash,
} from "lucide-react";

interface Wallet {
    publicKey: string;
    privateKey: string;
    mnemonic: string;
    path: string;
}

const WalletGenerator = () => {
    const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
    const [pathTypes, setPathTypes] = useState<string[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
    const [mnemonicInput, setMnemonicInput] = useState<string>("");
    const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
    const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
    const [gridView, setGridView] = useState<boolean>(false);
    const pathTypeNames: { [key: string]: string } = {
        "501": "Solana",
        "60": "Ethereum",
    };

    const pathTypeName = pathTypeNames[pathTypes[0]] || "";

    useEffect(() => {
        const storedWallets = localStorage.getItem("wallets");
        const storedMnemonic = localStorage.getItem("mnemonics");
        const storedPathTypes = localStorage.getItem("paths");

        if (storedWallets && storedMnemonic && storedPathTypes) {
            setMnemonicWords(JSON.parse(storedMnemonic));
            setWallets(JSON.parse(storedWallets));
            setPathTypes(JSON.parse(storedPathTypes));
            setVisiblePrivateKeys(JSON.parse(storedWallets).map(() => false));
            setVisiblePhrases(JSON.parse(storedWallets).map(() => false));
        }
    }, []);

    const handleDeleteWallet = (index: number) => {
        const updatedWallets = wallets.filter((_, i) => i !== index);
        const updatedPathTypes = pathTypes.filter((_, i) => i !== index);

        setWallets(updatedWallets);
        setPathTypes(updatedPathTypes);
        localStorage.setItem("wallets", JSON.stringify(updatedWallets));
        localStorage.setItem("paths", JSON.stringify(updatedPathTypes));
        setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
        setVisiblePhrases(visiblePhrases.filter((_, i) => i !== index));
    };

    const handleClearWallets = () => {
        localStorage.removeItem("wallets");
        localStorage.removeItem("mnemonics");
        localStorage.removeItem("paths");
        setWallets([]);
        setMnemonicWords([]);
        setPathTypes([]);
        setVisiblePhrases([]);
        setVisiblePrivateKeys([]);
        toast.success("All wallets cleared");
    };

    const generateWalletFromMnemonic = (
        pathType: string,
        mnemonic: string,
        accountIndex: number,
    ): Wallet | null => {
        try {
            const seedBuffer = mnemonicToSeedSync(mnemonic);
            const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
            const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

            let publicKeyEncoded: string;
            let privateKeyEncoded: string;

            if (pathType === "501") {
                const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
                const keypair = Keypair.fromSecretKey(secretKey);

                privateKeyEncoded = bs58.encode(secretKey);
                publicKeyEncoded = keypair.publicKey.toBase58();

            } else if (pathType === "60") {
                const privateKey = Buffer.from(derivedSeed).toString("hex");
                privateKeyEncoded = privateKey;

                const wallet = new ethers.Wallet(privateKey);
                publicKeyEncoded = wallet.address;

            } else {
                toast.error("Unsupported Path Type");
                return null;
            }
            return {
                publicKey: publicKeyEncoded,
                privateKey: privateKeyEncoded,
                mnemonic,
                path,
            };
        } catch (error) {
            toast.error("Failed to generate wallet. Please try again");
            return null;
        }
    };

    const handleGenerateWallet = () => {
        let mnemonic = mnemonicInput.trim();

        if (mnemonic) {
            if (!validateMnemonic(mnemonic)) {
                toast.error("Invalid recovery phrase. Please try again");
                return;
            }
        } else {
            mnemonic = generateMnemonic();
        }

        const words = mnemonic.split(" ");
        setMnemonicWords(words);

        const wallet = generateWalletFromMnemonic(
            pathTypes[0],
            mnemonic,
            wallets.length
        );
        if (wallet) {
            const updatedWallets = [...wallets, wallet];
            setWallets(updatedWallets);
            localStorage.setItem("wallets", JSON.stringify(updatedWallets));
            localStorage.setItem("mnemonics", JSON.stringify(words));
            localStorage.setItem("paths", JSON.stringify(pathTypes));
            setVisiblePhrases([...visiblePhrases, false]);
            toast.success("Wallet generated successfully");
        }
    };

    const handleAddWallet = () => {
        if (mnemonicWords.length === 0) {
            toast.error("No mnemonic found. Please generate a wallet first");
            return;
        }

        const wallet = generateWalletFromMnemonic(
            pathTypes[0],
            mnemonicWords.join(" "),
            wallets.length
        );

        if (wallet) {
            const updatedWallets = [...wallets, wallet];
            const updatedPathTypes = [...pathTypes];
            setWallets(updatedWallets);
            localStorage.setItem("wallets", JSON.stringify(updatedWallets));
            localStorage.setItem("pathTypes", JSON.stringify(updatedPathTypes));
            setVisiblePhrases([...visiblePhrases, false]);
            setVisiblePrivateKeys([...visiblePrivateKeys, false]);
            toast.success("Wallet generated successfully");
        }
    }

    return (
        <div>
            <div className='intro-div'>
                <h1 className="text-5xl font-bold intro-head">Khajana supports multiple blockchain</h1>
                <p className="text-2xl font-bold">Choose a blockchain to get started</p>

                <div className="wallet-selection">
                    <button className='wallet-selection-button'
                        onClick={() => {
                            setPathTypes(["501"]);
                            console.log("wallet selected");
                            console.log(pathTypeName);
                            toast.success(
                                "wallet selected"
                            );
                        }}
                    >Solana</button>
                    <br />
                    <button className='wallet-selection-button'
                        onClick={() => {
                            setPathTypes(["60"]);
                            console.log("wallet selected");
                            console.log(pathTypeName);
                            toast.success(
                                "wallet selected"
                            );
                        }}
                    >Ethereum</button>
                </div>
            </div>

            <div className='secret-block'>
                <div >
                    <h1 className='secret-head'>Secret Recovery Phrase</h1>
                    <p className='secret-warning'>Save this word in a safe place</p>
                </div>

                <div>
                    <div>
                        <input className='secret-input' title='input' type="password" onChange={(e) => setMnemonicInput(e.target.value)} value={mnemonicInput} />
                        <button className='secret-generation-button' onClick={() => handleGenerateWallet()}>
                            {mnemonicInput ? "Add wallet" : "Generate wallet"}
                        </button>
                    </div>
                </div>

                <div>
                    <div className='secret-phrases'>
                        <h2 className='secret-intro'>Your secret phrase</h2>
                        <button className='secret-mnemonic-handle' onClick={() => setShowMnemonic(!showMnemonic)}>{showMnemonic ? (
                            <h1>Hide</h1>
                        ) : (
                            <h1>Show</h1>
                        )}</button>
                    </div>

                    {showMnemonic && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-center w-full items-center mx-auto my-8">
                            {mnemonicWords.map((word, index) => (
                                <p className='phrases-words'
                                    key={index}
                                >
                                    {word}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {wallets.length > 0 && (
                <div>
                    <div className='wallets-section'>
                        <h2>{pathTypeName} Wallet</h2>
                    </div>
                    <div>
                        {wallets.length > 0 && (
                            <div className='wallets'>
                                <div className="wallet-section">
                                    <div >
                                        <button className='wallet-operation' onClick={() => handleAddWallet()}>
                                            Add wallet
                                        </button>
                                        <button className='wallet-operation' onClick={() => handleClearWallets()}>
                                            Delete Wallets
                                        </button>
                                    </div>

                                    <div>
                                        {wallets.map((wallet, index) => (
                                            <div key={wallet.publicKey}> {/* Add a key here */}
                                                <h3>
                                                    Wallet {index + 1}
                                                </h3>
                                                <div>
                                                    <span>Public Key</span>
                                                    <p>{wallet.publicKey}</p>
                                                    <span>Private Key</span>
                                                    <p>{wallet.privateKey}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default WalletGenerator;
