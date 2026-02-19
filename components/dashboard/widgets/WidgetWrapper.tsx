import React from 'react';

const WidgetWrapper: React.FC<{ title: string; children: React.ReactNode; autoHeight?: boolean; id?: string }> = ({ title, children, autoHeight = false, id }) => (
    <div id={id} className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {title && <h3 className="font-black text-[10px] text-text-secondary mb-3 uppercase tracking-[0.15em] shrink-0 truncate opacity-70">{title}</h3>}
        <div className={!autoHeight ? "flex-grow overflow-hidden" : ""}>{children}</div>
    </div>
);

export default WidgetWrapper;
