import type { ReactNode } from 'react';

interface DemoCardProps {
    title: string;
    description?: string;
    code?: string;
    children: ReactNode;
}

export const DemoCard = ({ title, description, code, children }: DemoCardProps) => {
    return (
        <div className="demo-card">
            <div className="demo-card-header">
                <h3 className="demo-card-title">{title}</h3>
                {description && <p className="demo-card-desc">{description}</p>}
            </div>
            <div className="demo-card-actions">{children}</div>
            {code && <pre className="demo-card-code">{code}</pre>}
        </div>
    );
};
