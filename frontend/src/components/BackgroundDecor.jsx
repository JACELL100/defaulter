export default function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-10 top-10 h-44 w-44 rounded-full bg-orange-300/60 blur-3xl float" />
      <div className="pointer-events-none absolute right-4 top-20 h-52 w-52 rounded-full bg-teal-300/50 blur-3xl float-delay" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-60 w-60 rounded-full bg-cyan-200/55 blur-3xl float" />
    </>
  )
}
