export function Logo({ panel }) {
  return (
    <div className="flex h-10 items-center">
      {panel ? (
        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
      ) : (
        <img
          src="/favicon.ico"
          alt="Logo"
          className="h-8 w-8 rounded-md object-contain"
        />
      )}
    </div>
  );
}
