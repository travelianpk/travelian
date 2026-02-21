type LegacyPageFrameProps = {
  src: string;
  title: string;
};

export default function LegacyPageFrame({ src, title }: LegacyPageFrameProps) {
  return (
    <iframe
      className="legacy-shell"
      src={src}
      title={title}
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
}
