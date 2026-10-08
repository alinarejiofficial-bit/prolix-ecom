"use client";
export default function QuantitySelect({
  quantity = 1,
  setQuantity = () => {},
  styleClass = "",
  minQuantity = 1,
  maxQuantity = 999,
}) {
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > minQuantity) {
      setQuantity(quantity - 1);
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "") return;

    const value = parseInt(raw, 10);
    if (isNaN(value)) return;

    if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (value >= minQuantity) {
      setQuantity(value);
    }
  };

  const handleBlur = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < minQuantity) {
      setQuantity(minQuantity);
      return;
    }
    if (value > maxQuantity) {
      setQuantity(maxQuantity);
    }
  };

  return (
    <>
      <div className={`wg-quantity ${styleClass} `}>
        <span
          className="btn-quantity btn-decrease"
          onClick={handleDecrease}
          role="button"
          tabIndex={0}
          style={{
            opacity: quantity <= minQuantity ? 0.5 : 1,
            cursor: quantity <= minQuantity ? "not-allowed" : "pointer",
          }}
        >
          -
        </span>
        <input
          className="quantity-product"
          type="number"
          name="number"
          value={quantity}
          min={minQuantity}
          max={maxQuantity}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <span
          className="btn-quantity btn-increase"
          onClick={handleIncrease}
          role="button"
          tabIndex={0}
          style={{ 
            opacity: quantity >= maxQuantity ? 0.5 : 1,
            cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer'
          }}
        >
          +
        </span>
      </div>
    </>
  );
}
