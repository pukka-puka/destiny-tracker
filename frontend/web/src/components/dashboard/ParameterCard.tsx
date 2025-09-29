// components/dashboard/ParameterCard.tsx

import { DestinyParameters, PARAMETER_LABELS, PARAMETER_COLORS } from '@/types/destiny.types';
import { 
  Heart, 
  DollarSign, 
  Activity, 
  Briefcase, 
  Users, 
  Star 
} from 'lucide-react';

interface ParameterCardProps {
  parameter: keyof DestinyParameters;
  value: number;
}

const PARAMETER_ICONS: Record<keyof DestinyParameters, React.ReactNode> = {
  love: <Heart className="w-5 h-5" />,
  money: <DollarSign className="w-5 h-5" />,
  health: <Activity className="w-5 h-5" />,
  work: <Briefcase className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  overall: <Star className="w-5 h-5" />
};

export default function ParameterCard({ parameter, value }: ParameterCardProps) {
  const color = PARAMETER_COLORS[parameter];
  const label = PARAMETER_LABELS[parameter];
  const icon = PARAMETER_ICONS[parameter];

  // 運勢レベルを判定
  const getLevel = (value: number) => {
    if (value >= 80) return { text: '絶好調', emoji: '🌟' };
    if (value >= 60) return { text: '好調', emoji: '😊' };
    if (value >= 40) return { text: '普通', emoji: '😌' };
    if (value >= 20) return { text: '要注意', emoji: '😔' };
    return { text: '低迷', emoji: '😢' };
  };

  const level = getLevel(value);

  return (
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2" style={{ color }}>
          {icon}
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span className="text-lg">{level.emoji}</span>
      </div>
      
      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="h-2 rounded-full transition-all duration-500"
          style={{ 
            width: `${value}%`,
            backgroundColor: color
          }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-gray-500">
          {level.text}
        </span>
      </div>
    </div>
  );
}
