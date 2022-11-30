import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from "react";
import {
  Button,
  Container,
  FileInput,
  Grid,
  Image,
  Input,
  Space,
} from "@mantine/core";

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import kp from "./keypair.json";

const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);

let baseAccount = web3.Keypair.fromSecretKey(secret);

const programId = new PublicKey("ArDjG9L5LhcTv4q5kgDdL5McZPrKzAWTcNRkSQPJqb59");

const network = clusterApiUrl("devnet");

const opts = {
  preflightCommitment: "processed",
};

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [gifLink, setGifLink] = useState("");
  const [gifList, setGifList] = useState(null);

  const connectWallet = async () => {
    if (window?.solana?.isPhantom) {
      console.log("supported phantom");

      const solanaInstance = window?.solana;

      const res = await solanaInstance?.connect({ isTrusted: true });
      const walletAddress = res?.publicKey?.toString();
      setWalletAddress(walletAddress);
      setLoading(false);
    } else {
      console.log("na");
    }
    setLoading(false);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );

    return provider;
  };

  useEffect(() => {
    const onLoad = async () => {
      await connectWallet();
      setLoading(false);
    };

    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  });

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programId, getProvider());
    console.log(idl, "my idl");

    return new Program(idl, programId, getProvider());
  };

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log(error, "errorrrr");
      setGifList([]);
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getGifList();
    }
  }, [walletAddress]);

  const submitGif = async () => {
    if (gifLink) {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.addGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      await getGifList();
      setGifLink("");
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && (
            <Button loading={loading} onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}

          {walletAddress && (
            <Container size="md" px="md">
              <Grid>
                <Grid.Col span={10}>
                  <Input
                    placeholder="Paste a GIF link here!"
                    value={gifLink}
                    onChange={(e) => {
                      setGifLink(e.target.value);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Button
                    loading={loading}
                    onClick={submitGif}
                    disabled={!gifLink}
                    fullWidth
                  >
                    Submit GIF
                  </Button>
                </Grid.Col>
              </Grid>

              <Space h="md" />
              {gifList === null && (
                <Button onClick={createGifAccount}>Create GIF account</Button>
              )}
              <Grid>
                {gifList?.map((item) => (
                  <Grid.Col span={3} key={item.gifLink}>
                    <Image
                      width={220}
                      radius="md"
                      src={item.gifLink}
                      alt="Random unsplash image"
                    />
                  </Grid.Col>
                ))}
              </Grid>
            </Container>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
