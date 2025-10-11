import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DataPoint {
  value: number;
  timestamp: string;
  inControl: boolean;
}

interface Props {
  projectId: string;
  metricName: string;
  target: number;
  usl?: number;
  lsl?: number;
}

export default function ControlChart({ projectId, metricName, target, usl, lsl }: Props) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    generateSampleData();
  }, [projectId, metricName]);

  const generateSampleData = () => {
    const points: DataPoint[] = [];
    const baseValue = target;
    const variance = (usl && lsl) ? (usl - lsl) / 6 : target * 0.1;

    for (let i = 0; i < 20; i++) {
      const randomVariation = (Math.random() - 0.5) * variance;
      const value = baseValue + randomVariation;
      const inControl = (!usl || value <= usl) && (!lsl || value >= lsl);

      points.push({
        value,
        timestamp: new Date(Date.now() - (19 - i) * 3600000).toISOString(),
        inControl,
      });
    }

    setDataPoints(points);
  };

  if (dataPoints.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No data available for control chart
      </div>
    );
  }

  const values = dataPoints.map(d => d.value);
  const maxValue = Math.max(...values, usl || target * 1.2);
  const minValue = Math.min(...values, lsl || target * 0.8);
  const range = maxValue - minValue;

  const chartHeight = 200;
  const chartPadding = 20;
  const availableHeight = chartHeight - (chartPadding * 2);

  const getY = (value: number) => {
    const normalized = (value - minValue) / range;
    return chartHeight - (normalized * availableHeight + chartPadding);
  };

  const getX = (index: number) => {
    return (index / (dataPoints.length - 1)) * 100;
  };

  const targetY = getY(target);
  const uslY = usl ? getY(usl) : null;
  const lslY = lsl ? getY(lsl) : null;

  const pathD = dataPoints
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${getX(index)} ${getY(point.value)}`;
    })
    .join(' ');

  const outOfControlCount = dataPoints.filter(d => !d.inControl).length;
  const processCapability = usl && lsl ? ((usl - lsl) / (6 * Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - target, 2), 0) / values.length))) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{metricName} Control Chart</h3>
          <p className="text-sm text-slate-600">X-bar Chart for Process Monitoring</p>
        </div>
        {outOfControlCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-red-700">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">{outOfControlCount} out of control</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">In control</span>
          </div>
        )}
      </div>

      <div className="relative bg-slate-50 rounded-lg p-4">
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: `${chartHeight}px` }}
        >
          {uslY !== null && (
            <>
              <line
                x1="0"
                y1={uslY}
                x2="100"
                y2={uslY}
                stroke="rgb(239, 68, 68)"
                strokeWidth="1"
                strokeDasharray="4 2"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x="2"
                y={uslY - 3}
                fill="rgb(239, 68, 68)"
                fontSize="8"
                vectorEffect="non-scaling-stroke"
              >
                USL
              </text>
            </>
          )}

          <line
            x1="0"
            y1={targetY}
            x2="100"
            y2={targetY}
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {lslY !== null && (
            <>
              <line
                x1="0"
                y1={lslY}
                x2="100"
                y2={lslY}
                stroke="rgb(239, 68, 68)"
                strokeWidth="1"
                strokeDasharray="4 2"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x="2"
                y={lslY + 10}
                fill="rgb(239, 68, 68)"
                fontSize="8"
                vectorEffect="non-scaling-stroke"
              >
                LSL
              </text>
            </>
          )}

          <path
            d={pathD}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {dataPoints.map((point, index) => (
            <circle
              key={index}
              cx={getX(index)}
              cy={getY(point.value)}
              r="3"
              fill={point.inControl ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              stroke="white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>20 samples</span>
          <span>Target: {target}</span>
          {usl && lsl && <span>Range: {lsl} - {usl}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Mean</div>
          <div className="text-xl font-bold text-slate-900">
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Std Dev</div>
          <div className="text-xl font-bold text-slate-900">
            {Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - target, 2), 0) / values.length).toFixed(2)}
          </div>
        </div>

        {processCapability !== null && (
          <>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Cp</div>
              <div className={`text-xl font-bold ${processCapability >= 1.33 ? 'text-green-600' : processCapability >= 1.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {processCapability.toFixed(2)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Status</div>
              <div className="text-sm font-medium text-slate-900">
                {processCapability >= 1.33 ? 'Excellent' : processCapability >= 1.0 ? 'Adequate' : 'Poor'}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Control Chart Interpretation</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Green points: Within specification limits (in control)</li>
          <li>• Red points: Outside specification limits (out of control)</li>
          <li>• Target line (green): Desired process center</li>
          <li>• UCL/LCL (red dashed): Upper and lower control limits</li>
          {processCapability !== null && (
            <li>• Cp ≥ 1.33: Process capable (Six Sigma quality)</li>
          )}
        </ul>
      </div>
    </div>
  );
}
