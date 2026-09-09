import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import { FileValidationResult } from '../../utils/fileValidator';

interface FileValidationReportProps {
  fileName: string;
  validation: FileValidationResult;
  headerValidation?: { isValid: boolean; missing: string[]; matchedCount: number };
  requiredCount?: number;
  onRemove?: () => void;
  darkMode?: boolean;
}

export const FileValidationReport: React.FC<FileValidationReportProps> = ({
  fileName,
  validation,
  headerValidation,
  requiredCount = 0,
  onRemove,
  darkMode = false,
}) => {
  const { isValid, errors, warnings, fileSizeMB, extension } = validation;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      errors.length > 0
        ? (darkMode ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-900')
        : warnings.length > 0 || (headerValidation && !headerValidation.isValid)
        ? (darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900')
        : (darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800')
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl mt-0.5 ${
            errors.length > 0 ? 'bg-red-500/20 text-red-500' :
            warnings.length > 0 ? 'bg-amber-500/20 text-amber-500' :
            'bg-brand-green/20 text-brand-green'
          }`}>
            {errors.length > 0 ? <AlertCircle className="w-5 h-5" /> :
             warnings.length > 0 ? <AlertTriangle className="w-5 h-5" /> :
             <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate max-w-[220px]">{fileName}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-xs'
              }`}>
                .{extension} • {fileSizeMB} MB
              </span>
            </div>

            {/* Errors */}
            {errors.map((err, idx) => (
              <p key={idx} className="text-xs mt-1.5 flex items-center gap-1.5 font-medium text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
              </p>
            ))}

            {/* Warnings */}
            {warnings.map((warn, idx) => (
              <p key={idx} className="text-xs mt-1.5 flex items-center gap-1.5 font-medium text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {warn}
              </p>
            ))}

            {/* Header Validation */}
            {headerValidation && (
              <div className="mt-2 text-xs flex flex-wrap items-center gap-3">
                <span className={`px-2 py-0.5 rounded-md font-semibold ${
                  headerValidation.isValid
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  Colunas Obrigatórias: {headerValidation.matchedCount}/{requiredCount} encontradas
                </span>
                {!headerValidation.isValid && (
                  <span className="text-red-500 font-medium">
                    Faltando: {headerValidation.missing.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            className={`p-1.5 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Remover arquivo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
