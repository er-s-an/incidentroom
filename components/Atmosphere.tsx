export default function Atmosphere() {
  return (
    <figure className="atmosphere">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ops-night.jpg"
        alt="Night ridge under a twilight sky — stand-in for overnight on-call"
        width={1600}
        height={900}
        loading="lazy"
      />
      <figcaption>
        Overnight on-call weather. Photo: lee Scott via picsum (grayscale). Not
        a customer screenshot.
      </figcaption>
    </figure>
  );
}
