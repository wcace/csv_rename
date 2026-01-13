
import Papa from 'papaparse';
import { MCodeMapping } from '../types';

/**
 * mcode 데이터를 가져와서 Map 객체로 변환합니다.
 */
export const fetchMCodeMapping = async (): Promise<MCodeMapping> => {
  const PROXY_URL = 'https://api.allorigins.win/raw?url=';
  const TARGET_URL = 'http://naturesoo21.hgodo.com/manage_code/mcode.txt';
  
  try {
    // CORS 문제를 피하기 위해 프록시 사용 시도
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
    
    const text = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const mapping: MCodeMapping = {};
          results.data.forEach((row: any) => {
            if (row[0] && row[1]) {
              mapping[row[0].toString().trim()] = row[1].toString().trim();
            }
          });
          resolve(mapping);
        },
        error: () => {
          // 파싱 실패 시 빈 매핑 반환
          resolve({});
        }
      });
    });
  } catch (error) {
    console.error('MCode Fetch Error:', error);
    throw error;
  }
};

/**
 * 업로드된 파일을 파싱하고 매칭 로직을 수행합니다.
 */
export const processInvoiceCsv = (
  file: File,
  mapping: MCodeMapping
): Promise<{ data: any[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const headers = results.meta.fields || [];
        
        // "재정의된 옵션명" 컬럼 추가
        if (!headers.includes('재정의된 옵션명')) {
          headers.push('재정의된 옵션명');
        }

        const processedData = data.map((row: any) => {
          const mcode = row['관리코드']?.toString().trim();
          const matchedName = mcode ? mapping[mcode] : null;
          
          return {
            ...row,
            '재정의된 옵션명': matchedName || '옵션명 없음'
          };
        });

        resolve({ data: processedData, headers });
      },
      error: (error) => reject(error)
    });
  });
};

/**
 * 데이터를 CSV 파일로 다운로드합니다.
 */
export const downloadCsv = (data: any[], headers: string[], fileName: string) => {
  const csv = Papa.unparse({
    fields: headers,
    data: data
  });

  // 한글 깨짐 방지를 위해 BOM(Byte Order Mark) 추가
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
