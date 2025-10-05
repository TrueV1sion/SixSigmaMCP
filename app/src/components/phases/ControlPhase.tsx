import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, Shield, Activity, FileText } from 'lucide-react';

interface ControlPhaseProps {
  projectId: string;
  onComplete: () => void;
}

export default function ControlPhase({ projectId, onComplete }: ControlPhaseProps) {
  const [controlItems, setControlItems] = useState({
    monitoring: false,
    documentation: false,
    validation: false,
    training: false
  });

  const markProjectComplete = async () => {
    await supabase
      .from('projects')
      .update({
        current_phase: 'COMPLETED',
        phase_completion: 100,
        quality_score: 95
      })
      .eq('id', projectId);
    onComplete();
  };

  const allItemsComplete = Object.values(controlItems).every(v => v);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Control Phase: Monitoring & Validation</h3>
        <p className="text-slate-600 mb-6">
          Establish controls to maintain improvements and ensure sustained quality.
        </p>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={controlItems.monitoring}
                onChange={(e) => setControlItems({ ...controlItems, monitoring: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-blue-600" />
                  <h4 className="font-semibold text-slate-900">Monitoring System Setup</h4>
                </div>
                <p className="text-sm text-slate-700">
                  Configure real-time monitoring dashboards, alerts, and control charts to track KPIs continuously.
                  Set up automated notifications for out-of-control conditions.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={controlItems.documentation}
                onChange={(e) => setControlItems({ ...controlItems, documentation: e.target.checked })}
                className="mt-1 w-5 h-5 text-green-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-green-600" />
                  <h4 className="font-semibold text-slate-900">Documentation Complete</h4>
                </div>
                <p className="text-sm text-slate-700">
                  Create Standard Operating Procedures (SOPs), process documentation, and knowledge base articles.
                  Document lessons learned and best practices for future projects.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={controlItems.validation}
                onChange={(e) => setControlItems({ ...controlItems, validation: e.target.checked })}
                className="mt-1 w-5 h-5 text-purple-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-purple-600" />
                  <h4 className="font-semibold text-slate-900">Validation Testing</h4>
                </div>
                <p className="text-sm text-slate-700">
                  Execute comprehensive validation testing to ensure all improvements are functioning correctly.
                  Verify that KPIs meet or exceed targets and quality standards are maintained.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={controlItems.training}
                onChange={(e) => setControlItems({ ...controlItems, training: e.target.checked })}
                className="mt-1 w-5 h-5 text-orange-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={20} className="text-orange-600" />
                  <h4 className="font-semibold text-slate-900">Team Training</h4>
                </div>
                <p className="text-sm text-slate-700">
                  Conduct training sessions for all team members on new processes and improvements.
                  Ensure everyone understands their role in maintaining quality standards.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-slate-900 mb-3">Control Plan Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Items Completed:</span>
              <p className="font-bold text-slate-900">
                {Object.values(controlItems).filter(v => v).length} / 4
              </p>
            </div>
            <div>
              <span className="text-slate-600">Ready for Deployment:</span>
              <p className={`font-bold ${allItemsComplete ? 'text-green-600' : 'text-orange-600'}`}>
                {allItemsComplete ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={markProjectComplete}
            disabled={!allItemsComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            Complete Control Phase & Close Project
          </button>
          {!allItemsComplete && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Complete all control items to close the project
            </p>
          )}
        </div>
      </div>

      {allItemsComplete && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
          <CheckCircle2 size={48} className="text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Ready for Deployment</h3>
          <p className="text-green-700">
            All DMAIC phases are complete. Your project is ready for production deployment with full quality controls in place.
          </p>
        </div>
      )}
    </div>
  );
}
