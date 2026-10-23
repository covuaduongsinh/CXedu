export const Logo = ({ light = false }: { light?: boolean }) => (
  <span className="inline-flex items-center gap-2 font-bold">
    <span
      aria-hidden
      className="grid size-8 grid-cols-2 grid-rows-2 overflow-hidden rounded-md ring-1 ring-white/30"
    >
      <span className="bg-primary" />
      <span className="bg-gold" />
      <span className="bg-gold" />
      <span className="bg-primary" />
    </span>
    <span className={light ? "text-white" : "text-primary"}>
      CX<span className="text-orange">edu</span>
    </span>
  </span>
);
