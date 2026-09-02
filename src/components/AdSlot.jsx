// Placeholder ad slot. Swap the inner markup for real AdSense (or
// whichever network) tags once an account exists — layout/sizing is
// already positioned to match Globle's ad placement pattern.
export default function AdSlot({ label = 'Advertisement', className = '' }) {
  return (
    <div className={`ad-slot ${className}`} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}
