export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <header className={`section-heading${light ? " section-heading--light" : ""}`}>
      <p className="section-heading__eyebrow">{eyebrow}</p>
      <div className="section-heading__row">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
}
