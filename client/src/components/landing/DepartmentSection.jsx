import { Link } from 'react-router-dom';
import { Shield, Flame, Activity, ArrowRight } from 'lucide-react';

const departments = [
  {
    name: 'Police Department',
    icon: Shield,
    color: '#2563EB', // blue-600
    borderColor: '#E2E8F0',
    handles: ['Theft & Robbery', 'Criminal Activity', 'Assault & Violence', 'Public Safety'],
    description: 'Centralized command for municipal law enforcement patrols, tactical response routing, and real-time citizen safety.',
    link: '/police',
  },
  {
    name: 'Fire Brigade',
    icon: Flame,
    color: '#DC2626', // red-600
    borderColor: '#E2E8F0',
    handles: ['Fire Outbreaks', 'Gas Leaks', 'Chemical Hazards', 'Structural Collapses'],
    description: 'Central dispatch operations for station units, hazard containment coordination, and search and rescue telemetry.',
    link: '/fire',
  },
  {
    name: 'Hospital Department',
    icon: Activity,
    color: '#16A34A', // green-600
    borderColor: '#E2E8F0',
    handles: ['Accidents & Injuries', 'Medical Triage', 'Critical Transport', 'Disaster Care'],
    description: 'Integrated operations for municipal emergency services, ambulance dispatching, and hospital admissions logs.',
    link: '/hospital',
  },
];

const DepartmentSection = () => {
  return (
    <section
      id="departments"
      className="py-24 bg-[#F8FAFC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">
            Command Center Divisions
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Response Departments
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Three core divisions coordinated through our centralized command systems for rapid response.
          </p>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {departments.map((dept) => {
            const IconComponent = dept.icon;
            return (
              <div
                key={dept.name}
                className="group rounded-xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:shadow-sm flex flex-col relative overflow-hidden"
              >
                {/* Top border strip */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: dept.color }}
                />

                <div className="p-8 flex flex-col flex-1">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center border border-[#E2E8F0] mb-6 transition-colors"
                    style={{ color: dept.color, backgroundColor: `${dept.color}08` }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2.5">
                    {dept.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#64748B] leading-relaxed mb-6">
                    {dept.description}
                  </p>

                  {/* Handles list */}
                  <div className="mb-8 flex-1">
                    <p className="text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-3">
                      Core Operations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.handles.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${dept.color}04`,
                            color: dept.color,
                            borderColor: `${dept.color}15`,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={dept.link}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all w-full"
                    style={{
                      backgroundColor: dept.color,
                    }}
                  >
                    <span>View Dispatch Panel</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DepartmentSection;
