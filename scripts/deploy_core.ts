import 'dotenv/config';
import {
    newClient,
    writeArtifact,
    readArtifact,
    deployContract,
    executeContract,
    uploadContract,
    instantiateContract,
    queryContract,
    toEncodedBinary,
} from './helpers.js';
import { join } from 'path';
import { chainConfigs } from "./types.d/chain_configs.js";

const ARTIFACTS_PATH = '../artifacts';
const furya = {
    config: {
        chainID: "furya-chain",
        network: "furya-network",
        lcd: "https://furya-lcd-url.com",
        gasPrices: {
            uusd: 0.15,
            uluna: 0.15
            // Add other gas prices as needed
        },
        gasAdjustment: 1.5,
        feeDenom: "uusd",
        bech32Prefix: {
            accAddr: "furya",
            accPub: "furyapub",
            valAddr: "furyavaloper",
            valPub: "furyavaloperpub",
            consensusAddr: "furyavalcons",
            consensusPub: "furyavalconspub"
        },
        // Add other necessary fields
    },
    // Add other necessary properties/methods for LCDClient if applicable
};
async function main() {
    const { furya, wallet } = newClient();
    console.log(`Initialized client for chainID: ${furya.config.chainID}`);

    try {
        await uploadAndInitToken(furya, wallet);
        await uploadPairContracts(furya, wallet);
        await uploadAndInitStaking(furya, wallet);
        await uploadAndInitFactory(furya, wallet);
        await uploadAndInitRouter(furya, wallet);
        await uploadAndInitMaker(furya, wallet);
        await uploadAndInitTreasury(furya, wallet);
        await uploadAndInitVesting(furya, wallet);
        await uploadAndInitGenerator(furya, wallet);
        await setupVestingAccounts(furya, wallet);
        console.log("All contracts uploaded and initialized successfully.");
    } catch (error) {
        console.error("Error in contract setup:", error);
    }
}

async function uploadAndInitToken(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Token Contract
    if (!network.tokenCodeID) {
        console.log('Uploading Token Contract...');
        network.tokenCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'token_contract.wasm'));
        console.log(`Token contract uploaded with codeId: ${network.tokenCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Token Contract
    if (!network.tokenAddress) {
        console.log('Initializing Token Contract...');
        const initMsg = {
            name: "Furya Token",
            symbol: "FRT",
            decimals: 6,
            initial_balances: [{ address: wallet.key.accAddress, amount: "1000000000" }],
        };
        network.tokenAddress = await deployContract(furya, wallet, network.tokenCodeID, initMsg);
        console.log(`Token contract initialized at address: ${network.tokenAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadPairContracts(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Pair Contracts
    if (!network.pairCodeID) {
        console.log('Uploading Pair Contracts...');
        network.pairCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'pair_contract.wasm'));
        console.log(`Pair contracts uploaded with codeId: ${network.pairCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitStaking(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Staking Contract
    if (!network.stakingCodeID) {
        console.log('Uploading Staking Contract...');
        network.stakingCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'staking_contract.wasm'));
        console.log(`Staking contract uploaded with codeId: ${network.stakingCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Staking Contract
    if (!network.stakingAddress) {
        console.log('Initializing Staking Contract...');
        const initMsg = {
            stakingParameters: { /* Parameters for staking */ },
            initialBalances: [{ address: wallet.key.accAddress, amount: "100000000" }]
        };
        network.stakingAddress = await deployContract(furya, wallet, network.stakingCodeID, initMsg);
        console.log(`Staking contract initialized at address: ${network.stakingAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitFactory(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Factory Contract
    if (!network.factoryCodeID) {
        console.log('Uploading Factory Contract...');
        network.factoryCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'factory_contract.wasm'));
        console.log(`Factory contract uploaded with codeId: ${network.factoryCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Factory Contract
    if (!network.factoryAddress) {
        console.log('Initializing Factory Contract...');
        const initMsg = {
            factoryParameters: { /* Parameters for factory */ },
            initialOwners: [wallet.key.accAddress]
        };
        network.factoryAddress = await deployContract(furya, wallet, network.factoryCodeID, initMsg);
        console.log(`Factory contract initialized at address: ${network.factoryAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitRouter(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Router Contract
    if (!network.routerCodeID) {
        console.log('Uploading Router Contract...');
        network.routerCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'router_contract.wasm'));
        console.log(`Router contract uploaded with codeId: ${network.routerCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Router Contract
    if (!network.routerAddress) {
        console.log('Initializing Router Contract...');
        const initMsg = {
            routerParameters: { /* Parameters for router */ },
            initialAdmins: [wallet.key.accAddress]
        };
        network.routerAddress = await deployContract(furya, wallet, network.routerCodeID, initMsg);
        console.log(`Router contract initialized at address: ${network.routerAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitMaker(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Maker Contract
    if (!network.makerCodeID) {
        console.log('Uploading Maker Contract...');
        network.makerCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'maker_contract.wasm'));
        console.log(`Maker contract uploaded with codeId: ${network.makerCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Maker Contract
    if (!network.makerAddress) {
        console.log('Initializing Maker Contract...');
        const initMsg = {
            makerParameters: { /* Parameters for maker */ },
            initialAdmins: [wallet.key.accAddress]
        };
        network.makerAddress = await deployContract(furya, wallet, network.makerCodeID, initMsg);
        console.log(`Maker contract initialized at address: ${network.makerAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitTreasury(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Treasury Contract
    if (!network.treasuryCodeID) {
        console.log('Uploading Treasury Contract...');
        network.treasuryCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'treasury_contract.wasm'));
        console.log(`Treasury contract uploaded with codeId: ${network.treasuryCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Treasury Contract
    if (!network.treasuryAddress) {
        console.log('Initializing Treasury Contract...');
        const initMsg = {
            treasuryParameters: { /* Parameters for treasury */ },
            initialAdmins: [wallet.key.accAddress]
        };
        network.treasuryAddress = await deployContract(furya, wallet, network.treasuryCodeID, initMsg);
        console.log(`Treasury contract initialized at address: ${network.treasuryAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitVesting(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Vesting Contract
    if (!network.vestingCodeID) {
        console.log('Uploading Vesting Contract...');
        network.vestingCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'vesting_contract.wasm'));
        console.log(`Vesting contract uploaded with codeId: ${network.vestingCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Vesting Contract
    if (!network.vestingAddress) {
        console.log('Initializing Vesting Contract...');
        const initMsg = {
            vestingParameters: { /* Parameters for vesting */ },
            initialAdmins: [wallet.key.accAddress]
        };
        network.vestingAddress = await deployContract(furya, wallet, network.vestingCodeID, initMsg);
        console.log(`Vesting contract initialized at address: ${network.vestingAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function uploadAndInitGenerator(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Upload Generator Contract
    if (!network.generatorCodeID) {
        console.log('Uploading Generator Contract...');
        network.generatorCodeID = await uploadContract(furya, wallet, join(ARTIFACTS_PATH, 'generator_contract.wasm'));
        console.log(`Generator contract uploaded with codeId: ${network.generatorCodeID}`);
        writeArtifact(network, furya.config.chainID);
    }

    // Initialize Generator Contract
    if (!network.generatorAddress) {
        console.log('Initializing Generator Contract...');
        const initMsg = {
            generatorParameters: { /* Parameters for generator */ },
            initialAdmins: [wallet.key.accAddress]
        };
        network.generatorAddress = await deployContract(furya, wallet, network.generatorCodeID, initMsg);
        console.log(`Generator contract initialized at address: ${network.generatorAddress}`);
        writeArtifact(network, furya.config.chainID);
    }
}

async function setupVestingAccounts(furya, wallet) {
    let network = readArtifact(furya.config.chainID);

    // Setup Vesting Accounts
    if (!network.vestingAccountsSetup) {
        console.log('Setting up Vesting Accounts...');
        const initMsg = {
            vestingAccounts: [{ /* Vesting account details */ }]
        };
        await executeContract(furya, wallet, network.vestingAddress, { setupVestingAccounts: initMsg });
        network.vestingAccountsSetup = true;
        console.log('Vesting Accounts setup completed successfully.');
        writeArtifact(network, furya.config.chainID);
    }
}

main(); // Call main function to start the deployment process
