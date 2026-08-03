import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, Download, FileSpreadsheet } from 'lucide-react';

const ExportMenu = ({ onExportCSV, onExportPDF, label = "Exporter" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center transition-all focus:ring-2 focus:ring-gray-900 outline-none shadow-sm"
            >
                <Download className="w-4 h-4 mr-2 text-gray-400" />
                {label}
                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-xl z-50 focus:outline-none animate-in fade-in zoom-in duration-100">
                    <div className="py-1">
                        <button
                            onClick={() => { onExportCSV(); setIsOpen(false); }}
                            className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileSpreadsheet className="mr-3 h-4 w-4 text-green-600" />
                            <span>Exporter en CSV</span>
                        </button>
                        <button
                            onClick={() => { onExportPDF(); setIsOpen(false); }}
                            className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="mr-3 h-4 w-4 text-red-600" />
                            <span>Télécharger en PDF</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
