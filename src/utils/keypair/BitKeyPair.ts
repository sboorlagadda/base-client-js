import { KeyPairHelper } from './KeyPairHelper';
import CryptoUtils from '../CryptoUtils';
import KeyPair from './KeyPair';

const bitcore = require('bitcore-lib');
const Message = require('bitcore-message');
const ECIES = require('bitcore-ecies');
const Mnemonic = require('bitcore-mnemonic');

export default class BitKeyPair implements KeyPairHelper {

    private privateKey: any;
    private publicKey: any;
    private addr: any;

    public createKeyPair(passPhrase: string): KeyPair {
        const pbkdf2: string = CryptoUtils.PBKDF2(passPhrase, 256);
        const hash: any = bitcore.crypto.Hash.sha256(new bitcore.deps.Buffer(pbkdf2));
        const bn: any = bitcore.crypto.BN.fromBuffer(hash);
        this.privateKey = new bitcore.PrivateKey(bn);
        this.publicKey = this.privateKey.toPublicKey();
        this.addr = this.privateKey.toAddress();

        const privateKeyHex: string = this.privateKey.toString(16);
        const publicKeyHex = this.publicKey.toString(16);

        return new KeyPair(privateKeyHex, publicKeyHex);
    }

    public generateMnemonicPhrase(): string {
        return new Mnemonic(Mnemonic.Words.ENGLISH).toString();
    }

    public initKeyPairFromPrvKey(prvKey: string): KeyPair {
        this.privateKey = new bitcore.PrivateKey(bitcore.crypto.BN.fromString(prvKey, 16));
        this.publicKey = this.privateKey.toPublicKey();
        this.addr = this.privateKey.toAddress();

        const privateKeyHex: string = this.privateKey.toString(16);
        const publicKeyHex = this.publicKey.toString(16);

        return new KeyPair(privateKeyHex, publicKeyHex);
    }

    public signMessage(data: string): string {
        const message = new Message(data);

        return message.sign(this.privateKey);
    }

    public checkSig(data: any, sig: string): boolean {
        try {
            return Message(data).verify(this.privateKey.toAddress(), sig);
        } catch (e) {
            return false;
        }
    }

    public getPublicKey(): string {
        return this.publicKey.toString(16);
    }

    public getAddr(): string {
        return this.addr.toString(16);
    }

    public encryptMessage(recipientPk: string, message: string): string {
        const ecies: any = ECIES()
            .privateKey(this.privateKey)
            .publicKey(bitcore.PublicKey.fromString(recipientPk));

        return ecies.encrypt(message)
            .toString('base64');
    }

    public generatePasswordForField(fieldName: String): string {
        return CryptoUtils.PBKDF2(
            CryptoUtils.keccak256(this.privateKey.toString(16)) + fieldName.toLowerCase(),
            384
        );
    }

    public decryptMessage(senderPk: string, encrypted: string): string {
        const ecies: any = ECIES()
            .privateKey(this.privateKey)
            .publicKey(bitcore.PublicKey.fromString(senderPk));

        return ecies
            .decrypt(new Buffer(encrypted, 'base64'))
            .toString();
    }

}
