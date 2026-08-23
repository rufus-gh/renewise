interface Props {
  index: string
  title: string
  meta?: string
}

/** Tiny index + name hung on a hairline. The index encodes reading
 *  order through the argument, so it is information, not decoration. */
export function SectionLabel({ index, title, meta }: Props) {
  return (
    <div className="slabel">
      <span className="slabel__i num">{index}</span>
      <span className="slabel__t">{title}</span>
      {meta && <span className="slabel__n">{meta}</span>}
    </div>
  )
}
