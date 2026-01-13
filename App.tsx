
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileUp, 
  Download, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText,
  RefreshCw
} from 'lucide-react';
import { AppStatus, MCodeMapping, ProcessingResult } from './types';
import { fetchMCodeMapping, processInvoiceCsv, downloadCsv } from './services/csvService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING_MAPPING);
  const [mapping, setMapping] = useState<MCodeMapping>({});
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 초기 매핑 데이터 로드
  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchMCodeMapping();
        setMapping(data);
        setStatus(AppStatus.READY_FOR_UPLOAD);
      } catch (err) {
        console.error(err);
        setError('기준 정보(mcode.txt)를 불러오는데 실패했습니다. 인터넷 연결을 확인해주세요.');
        setStatus(AppStatus.ERROR);
      }
    };
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus(AppStatus.PROCESSING);
    try {
      const { data, headers } = await processInvoiceCsv(file, mapping);
      setResult({
        fileName: file.name.replace('.csv', '_옵션추가완료.csv'),
        data,
        headers,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus(AppStatus.COMPLETED);
    } catch (err) {
      setError('파일 처리 중 오류가 발생했습니다. CSV 형식을 확인해주세요.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadCsv(result.data, result.headers, result.fileName);
    }
  };

  const resetApp = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus(AppStatus.READY_FOR_UPLOAD);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            주문송장 옵션 자동 매칭기
          </h1>
          <p className="mt-2 text-indigo-100 opacity-90">
            주문송장.csv의 관리코드를 기반으로 상품명을 자동으로 매칭하여 새 옵션명을 생성합니다.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Status Alert for Loading Mapping */}
          {status === AppStatus.LOADING_MAPPING && (
            <div className="flex items-center justify-center py-12 gap-3 text-indigo-600">
              <Loader2 className="animate-spin w-6 h-6" />
              <span className="font-medium text-lg">기준 정보(mcode) 불러오는 중...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">오류 발생</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-700 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> 새로고침하여 다시 시도
                </button>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {status !== AppStatus.LOADING_MAPPING && status !== AppStatus.ERROR && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ① 주문송장.csv 파일 업로드 (필수)
                </label>
                <div className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    {file ? (
                      <>
                        <div className="bg-indigo-500 p-3 rounded-full text-white shadow-md">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-indigo-700 truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-indigo-500">파일이 준비되었습니다.</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 p-3 rounded-full text-gray-400">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <span className="text-gray-600 font-medium">파일을 선택하거나 드래그하세요</span>
                        <span className="text-xs text-gray-400">CSV 확장자만 지원합니다</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleProcess}
                  disabled={!file || status === AppStatus.PROCESSING}
                  className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-md ${
                    !file || status === AppStatus.PROCESSING
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                  }`}
                >
                  {status === AppStatus.PROCESSING ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  옵션명 생성하기
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!result}
                  className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-md ${
                    !result
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  결과 다운로드
                </button>
              </div>
            </div>
          )}

          {/* Result Stats */}
          {result && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">처리 결과 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">데이터 수:</span>
                  <span className="ml-2 font-mono text-gray-800">{result.data.length} 건</span>
                </div>
                <div>
                  <span className="text-gray-400">완료 시각:</span>
                  <span className="ml-2 font-mono text-gray-800">{result.timestamp}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-green-600 font-medium mt-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>'재정의된 옵션명' 컬럼이 성공적으로 추가되었습니다.</span>
                </div>
              </div>
              <button 
                onClick={resetApp}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" /> 새로 시작하기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 text-center">
          <p className="text-gray-400 text-xs">
            © 2024 업무 자동화 도구 - 모든 처리는 브라우저 내부에서 안전하게 진행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
