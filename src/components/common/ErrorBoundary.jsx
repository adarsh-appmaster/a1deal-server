import { Component } from 'react';

// Catches render-time errors anywhere below it so a single bad component can't
// white-screen the whole app. Without this, e.g. a missing import or a null
// dereference in one page takes down the entire SPA with a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface to the console for debugging; wire to a logging service if desired.
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
          <span className="material-icons-outlined text-6xl text-primary/40 mb-4">error_outline</span>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-2">Something went wrong</h1>
          <p className="text-slate-500 text-sm max-w-md mb-6">
            An unexpected error occurred while displaying this page. Reloading usually fixes it.
          </p>
          <div className="flex gap-3">
            <button onClick={this.handleReload}
              className="px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-container transition">
              Reload Page
            </button>
            <button onClick={() => { window.location.href = '/'; }}
              className="px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
