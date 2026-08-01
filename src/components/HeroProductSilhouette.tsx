const droplets = [
  { className: 'hero-can__drop hero-can__drop--one' },
  { className: 'hero-can__drop hero-can__drop--two' },
  { className: 'hero-can__drop hero-can__drop--three' },
  { className: 'hero-can__drop hero-can__drop--four' },
]

export default function HeroProductSilhouette() {
  return (
    <div className="hero-product" aria-hidden="true">
      <div className="hero-can">
        <span className="hero-can__rim hero-can__rim--top" />
        <span className="hero-can__rim hero-can__rim--bottom" />
        <span className="hero-can__identity">SPECTRUM<br />01</span>
        {droplets.map((drop) => <i key={drop.className} className={drop.className} />)}
      </div>
    </div>
  )
}
