import { Product } from "../../types";

type Props = {
  sellItem: Product | null;
  sellQty: number;
  setSellQty: (qty: number) => void;
  setSellItem: (item: Product | null) => void;
  confirmSell: () => void;
};

export default function SellModal({
  sellItem,
  sellQty,
  setSellQty,
  setSellItem,
  confirmSell,
}: Props) {

  if (!sellItem) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

      <div className="bg-gray-900 p-6 rounded-2xl w-[380px] text-white">

        <h2 className="text-xl mb-2">Sell Product</h2>

        <p className="text-gray-400 mb-4">
          {sellItem.name} — Stock: {sellItem.stock}
        </p>

        <input
          className="p-2 rounded bg-white/10 w-full mb-4"
          type="number"
          min={1}
          max={sellItem.stock}
          value={sellQty}
          onChange={(e) => setSellQty(Number(e.target.value))}
        />

        <div className="flex justify-between">
          <button onClick={() => setSellItem(null)}>
            Cancel
          </button>

          <button
            onClick={confirmSell}
            className="bg-green-600 px-4 py-2 rounded-xl"
          >
            Confirm Sell
          </button>
        </div>

      </div>
    </div>
  );
}