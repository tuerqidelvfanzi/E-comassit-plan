/**
 * 标题优化组件
 * V3需求: FR-RW-01 标题改写
 */
import { useState, useCallback } from 'react';
import { Card, Button } from '../ui';
import { validateVietnamTitle, countVietnameseChars } from '../../../../shared/src/validation';
import { translatePhrase } from '../../../../shared/src/translation';

interface TitleOptimizerProps {
  initialTitle?: string;
  locale?: 'vi-VN' | 'th-TH' | 'fil-PH' | 'id-ID';
  onOptimized?: (title: string) => void;
}

const LOCALE_LIMITS: Record<string, number> = {
  'vi-VN': 20,
  'th-TH': 220,
  'fil-PH': 120,
  'id-ID': 120
};

const LOCALE_NAMES: Record<string, string> = {
  'vi-VN': '越南语',
  'th-TH': '泰语',
  'fil-PH': '菲律宾语',
  'id-ID': '印尼语'
};

export function TitleOptimizer({ 
  initialTitle = '', 
  locale = 'vi-VN',
  onOptimized 
}: TitleOptimizerProps) {
  const [originalTitle, setOriginalTitle] = useState(initialTitle);
  const [optimizedTitle, setOptimizedTitle] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationSteps, setOptimizationSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const charLimit = LOCALE_LIMITS[locale];
  
  const extractKeywords = useCallback((title: string): string[] => {
    const keywords: string[] = [];
    const patterns = [
      /T恤|短袖|长袖|衬衫|卫衣|外套|裤子|裙子/g,
      /纯棉|棉质|涤纶|丝绸|羊毛/g,
      /男童|女童|儿童|男孩|女孩/g,
      /蓝色|白色|黑色|红色|粉色|绿色|黄色/g,
      /可爱|时尚|休闲|百搭|运动/g,
      /卡通|印花|刺绣/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(title)) !== null) {
        keywords.push(match[0]);
      }
    });
    
    return [...new Set(keywords)];
  }, []);
  
  const compressSemantic = useCallback((title: string, maxChars: number): string => {
    const keywords = extractKeywords(title);
    const priorityPatterns = [
      /T恤|短袖|衬衫|卫衣|外套|裤子|裙子/,
      /纯棉|棉质|涤纶/,
      /男童|女童|儿童/,
      /蓝色|白色|黑色|红色|粉色|绿色|黄色/
    ];
    
    let compressed = '';
    priorityPatterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match && !compressed.includes(match[0])) {
        compressed += match[0];
      }
    });
    
    if (compressed.length < maxChars * 0.5) {
      keywords.slice(0, 5).forEach(k => {
        if (!compressed.includes(k) && compressed.length + k.length <= maxChars) {
          compressed += k;
        }
      });
    }
    
    return compressed;
  }, [extractKeywords]);
  
  const optimizeTitle = useCallback(async () => {
    if (!originalTitle.trim()) {
      setError('请输入原始标题');
      return;
    }
    
    setIsOptimizing(true);
    setError(null);
    setOptimizationSteps([]);
    
    try {
      const steps: string[] = [];
      const keywords = extractKeywords(originalTitle);
      steps.push('提取关键词: ' + keywords.join('、'));
      setOptimizationSteps([...steps]);
      
      const compressed = compressSemantic(originalTitle, 10);
      steps.push('语义压缩: ' + compressed);
      setOptimizationSteps([...steps]);
      
      const translated = translatePhrase(compressed, locale);
      steps.push('翻译为' + LOCALE_NAMES[locale] + ': ' + translated);
      setOptimizationSteps([...steps]);
      
      let finalTitle = translated;
      const charCount = countVietnameseChars(translated);
      if (charCount > charLimit) {
        const chars = Array.from(translated);
        while (countVietnameseChars(chars.join('')) > charLimit && chars.length > 0) {
          chars.pop();
        }
        finalTitle = chars.join('');
        steps.push('字符截断: ' + charCount + ' -> ' + countVietnameseChars(finalTitle));
      } else {
        steps.push('字符计数: ' + charCount + '字符 ✓');
      }
      setOptimizationSteps([...steps]);
      
      const validation = validateVietnamTitle(finalTitle);
      if (!validation.passed) {
        const errorMsgs = validation.errors.map(e => e.message).join('; ');
        steps.push('违禁词检测: ' + errorMsgs);
        setError(errorMsgs);
      } else {
        steps.push('违禁词检测: 通过 ✓');
      }
      setOptimizationSteps([...steps]);
      
      setOptimizedTitle(finalTitle);
      onOptimized?.(finalTitle);
      
    } catch (err) {
      setError('优化失败，请重试');
    } finally {
      setIsOptimizing(false);
    }
  }, [originalTitle, locale, charLimit, extractKeywords, compressSemantic, onOptimized]);
  
  const copyToClipboard = useCallback(() => {
    if (optimizedTitle) {
      navigator.clipboard.writeText(optimizedTitle);
    }
  }, [optimizedTitle]);
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">标题优化</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">原始标题</label>
        <textarea
          className="w-full min-h-[80px] p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] resize-y"
          placeholder="输入中文标题"
          value={originalTitle}
          onChange={(e) => setOriginalTitle(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">字符数: {originalTitle.length}</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">目标平台</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LOCALE_NAMES).map(([code, name]) => (
            <button
              key={code}
              className={"px-3 py-1.5 rounded-lg text-sm transition " + (
                locale === code
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-muted)] hover:bg-[var(--color-border)]'
              )}
            >
              {name} ({LOCALE_LIMITS[code]}字)
            </button>
          ))}
        </div>
      </div>
      
      <Button
        className="w-full mb-4"
        onClick={optimizeTitle}
        disabled={isOptimizing || !originalTitle.trim()}
      >
        {isOptimizing ? '优化中...' : '运行优化'}
      </Button>
      
      {optimizationSteps.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--color-muted)]">
          <h4 className="text-sm font-medium mb-2">优化步骤</h4>
          <ul className="text-xs space-y-1 text-[var(--color-text-2)]">
            {optimizationSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {optimizedTitle && !error && (
        <div className="p-4 rounded-lg bg-[var(--color-primary-soft)] border border-[var(--color-primary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">优化后标题</span>
            <span className="text-xs text-[var(--color-success)]">
              {countVietnameseChars(optimizedTitle)}/{charLimit}字符 ✓
            </span>
          </div>
          <p className="text-lg font-medium mb-3">{optimizedTitle}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyToClipboard}>复制</Button>
            <Button size="sm" variant="outline" onClick={() => setOptimizedTitle('')}>重置</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default TitleOptimizer;
