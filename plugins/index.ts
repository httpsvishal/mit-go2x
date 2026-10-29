import { registry, ProgramTypePlugin } from '@/core/registry';

// Class-level (COE)
import { CoeRawSchema, CoeRawRow } from './class-level/schema';
import { adaptCoeRaw } from './class-level/adapter';
import { classLevelKpis } from './class-level/kpis';
import { classLevelInsights } from './class-level/insights';
import { classLevelChecks } from './class-level/checks';

// Student-matrix (Super 30)
import { MatrixRawSchema, MatrixRawRow } from './student-matrix/schema';
import { adaptMatrixRaw } from './student-matrix/adapter';
import { studentMatrixKpis } from './student-matrix/kpis';
import { studentMatrixInsights } from './student-matrix/insights';
import { studentMatrixChecks } from './student-matrix/checks';

// Visual charts
import { SectionLeagueChart } from '@/components/charts/SectionLeagueChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { PeriodProfileChart } from '@/components/charts/PeriodProfileChart';
import { StudentHistogramChart } from '@/components/charts/StudentHistogramChart';

const classLevelPlugin: ProgramTypePlugin = {
  type: 'class-level',
  schema: CoeRawSchema,
  adapt: adaptCoeRaw,
  kpis: classLevelKpis,
  charts: [
    {
      id: 'sectionLeague',
      title: 'Section Performance & Leadership',
      subtitle: 'Compares section attendance against batch average to highlight leading sections and support opportunities',
      appliesTo: ['class-level', '*'],
      component: SectionLeagueChart,
    },
    {
      id: 'trendLine',
      title: 'Attendance Trend Over Time',
      subtitle: 'Daily class attendance and 3-day rolling trend, highlighting positive participation gains over the term',
      appliesTo: ['class-level', '*'],
      component: TrendLineChart,
    },
    {
      id: 'periodProfile',
      title: 'Class Engagement by Period',
      subtitle: 'Period comparison profile highlighting peak engagement hours and opportunities to boost afternoon turnout',
      appliesTo: ['class-level'],
      component: PeriodProfileChart,
    },
  ],
  insights: classLevelInsights,
  pages: [
    {
      id: 'periods',
      label: 'Periods & Classes',
      component: () => null, // Routed via page.tsx
    },
  ],
  dataQualityChecks: classLevelChecks,
};

const studentMatrixPlugin: ProgramTypePlugin = {
  type: 'student-matrix',
  schema: MatrixRawSchema,
  adapt: adaptMatrixRaw,
  kpis: studentMatrixKpis,
  charts: [
    {
      id: 'sectionLeague',
      title: 'Section Performance & Leadership',
      subtitle: 'Compares section attendance against batch average to highlight leading sections and support opportunities',
      appliesTo: ['student-matrix', '*'],
      component: SectionLeagueChart,
    },
    {
      id: 'trendLine',
      title: 'Attendance Trend Over Time',
      subtitle: 'Daily class attendance and 3-day rolling trend, highlighting positive participation gains over the term',
      appliesTo: ['student-matrix', '*'],
      component: TrendLineChart,
    },
    {
      id: 'studentHistogram',
      title: 'Student Attendance & Achievement Levels',
      subtitle: 'Shows students meeting the 75% target, steady attendees, and students where regular faculty check-ins create immediate positive impact',
      appliesTo: ['student-matrix'],
      component: StudentHistogramChart,
    },
  ],
  insights: studentMatrixInsights,
  pages: [
    {
      id: 'students',
      label: 'Students List',
      component: () => null, // Routed via page.tsx
    },
  ],
  dataQualityChecks: studentMatrixChecks,
};

// Register all plugins
registry.registerPlugin(classLevelPlugin);
registry.registerPlugin(studentMatrixPlugin);

export function initPlugins(): void {
  // Ensure plugins are initialized and registered into registries
}
