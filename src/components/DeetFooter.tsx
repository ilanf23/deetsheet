const DeetFooter = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DeetSheet" className="h-24" />
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">About</a>
            <a href="#" className="hover:text-foreground transition">FAQ</a>
            <a href="#" className="hover:text-foreground transition">Contact</a>
            <a href="#" className="hover:text-foreground transition">Terms</a>
            <a href="#" className="hover:text-foreground transition">Privacy</a>
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 DeetSheet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default DeetFooter;
