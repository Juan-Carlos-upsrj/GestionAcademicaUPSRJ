
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackRender?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallbackRender) {
                return this.props.fallbackRender(this.state.error!, () => this.setState({ hasError: false }));
            }

            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
                    <div className="bg-rose-100 p-4 rounded-full mb-4">
                        <span className="text-rose-600 text-4xl">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h2>
                    <p className="text-slate-500 mb-6 max-w-md">
                        Ocurrió un error inesperado.
                    </p>
                    {this.state.error && (
                        <div className="bg-slate-100 p-3 rounded-lg text-left w-full max-w-lg mb-6 overflow-auto max-h-48 text-xs font-mono border border-slate-200">
                            <p className="font-bold text-rose-700 mb-1">{this.state.error.toString()}</p>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        Recargar Aplicación
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
