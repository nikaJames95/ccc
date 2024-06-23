import {
  Cell,
  OutPointLike,
  Script,
  ScriptLike,
  TransactionLike,
} from "../ckb";
import { Hex, HexLike } from "../hex";
import { NumLike, numFrom } from "../num";
import {
  ClientFindCellsResponse,
  ClientIndexerSearchKeyLike,
  ClientTransactionResponse,
  OutputsValidator,
} from "./clientTypes";

export enum KnownScript {
  Secp256k1Blake160,
  Secp256k1Multisig,
  AnyoneCanPay,
  JoyId,
  COTA,
  OmniLock,
}

export abstract class Client {
  abstract getUrl(): string;

  abstract getAddressPrefix(): Promise<string>;
  abstract getKnownScript(
    script: KnownScript,
  ): Promise<Pick<Script, "codeHash" | "hashType">>;

  abstract sendTransaction(
    transaction: TransactionLike,
    validator?: OutputsValidator,
  ): Promise<Hex>;
  abstract getTransaction(
    txHash: HexLike,
  ): Promise<ClientTransactionResponse | null>;

  async getCell(outPoint: OutPointLike): Promise<Cell | null> {
    const transaction = await this.getTransaction(outPoint.txHash);
    if (!transaction) {
      return null;
    }

    const index = Number(numFrom(outPoint.index));
    if (index >= transaction.transaction.outputs.length) {
      return null;
    }

    return Cell.from({
      outPoint,
      cellOutput: transaction.transaction.outputs[index],
      outputData: transaction.transaction.outputsData[index] ?? "0x",
      blockNumber: transaction.blockNumber,
    });
  }

  abstract findCellsPaged(
    key: ClientIndexerSearchKeyLike,
    order?: "asc" | "desc",
    limit?: NumLike,
    after?: string,
  ): Promise<ClientFindCellsResponse>;

  async *findCells(
    key: ClientIndexerSearchKeyLike,
    order?: "asc" | "desc",
    limit = 10,
  ): AsyncGenerator<Cell> {
    let last: string | undefined = undefined;

    while (true) {
      const { cells, lastCursor } = await this.findCellsPaged(
        key,
        order,
        limit,
        last,
      );
      for (const cell of cells) {
        yield cell;
      }
      if (cells.length === 0 || cells.length < limit) {
        return;
      }
      last = lastCursor;
    }
  }

  findCellsByLockAndType(
    lock: ScriptLike,
    type: ScriptLike,
    withData = true,
  ): AsyncGenerator<Cell> {
    return this.findCells({
      script: lock,
      scriptType: "lock",
      scriptSearchMode: "exact",
      filter: {
        script: type,
      },
      withData,
    });
  }
}
