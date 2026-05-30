import {
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Plug,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardSection } from './types';

export interface NavItem {
  id: DashboardSection;
  label: string;
  description: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Unified project context feed',
    icon: LayoutDashboard,
    shortcut: '1',
  },
  {
    id: 'ask',
    label: 'Ask',
    description: 'Coral SQL on-demand search',
    icon: MessageSquareText,
    shortcut: '2',
  },
  {
    id: 'logs',
    label: 'Logs',
    description: 'Refresh history & diagnostics',
    icon: ScrollText,
    shortcut: '3',
  },
  {
    id: 'sources',
    label: 'Sources',
    description: 'GitHub, Linear, Slack, Notion',
    icon: Plug,
    shortcut: '4',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Agent & scheduler config',
    icon: Settings,
    shortcut: '5',
  },
];
