import { Link } from 'react-router-dom';
import { Shield, Flame, Activity, ArrowRight } from 'lucide-react';

const departments = [
  {
    name: 'Police Department',
    icon: Shield,
    color: '#2563EB', // blue-600
    hoverShadow: 'hover:shadow-[0_0_45px_rgba(37,99,235,0.25)]',
    hoverBorder: 'hover:border-blue-500/40',
    handles: ['Theft & Robbery', 'Criminal Activity', 'Assault & Violence', 'Public Safety'],
    description: 'Centralized command for municipal law enforcement patrols, tactical response routing, and real-time citizen safety.',
    link: '/police',
  },
  {
    name: 'Fire Brigade',
    icon: Flame,
    color: '#DC2626', // red-600
    hoverShadow: 'hover:shadow-[0_0_45px_rgba(220,38,38,0.25)]',
    hoverBorder: 'hover:border-red-500/40',
    handles: ['Fire Outbreaks', 'Gas Leaks', 'Chemical Hazards', 'Structural Collapses'],
    description: 'Central dispatch operations for station units, hazard containment coordination, and search and rescue telemetry.',
    link: '/fire',
  },
  {
    name: 'Hospital Department',
    icon: Activity,
    color: '#16A34A', // green-600
    hoverShadow: 'hover:shadow-[0_0_45px_rgba(22,163,74,0.25)]',
    hoverBorder: 'hover:border-green-500/40',
    handles: ['Accidents & Injuries', 'Medical Triage', 'Critical Transport', 'Disaster Care'],
    description: 'Integrated operations for municipal emergency services, ambulance dispatching, and hospital admissions logs.',
    link: '/hospital',
  },
];

const DepartmentSection = () => {
  return (
    <section
      id="departments"
      className="py-28 bg-[#000000] relative"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-red-900/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#E8602E] uppercase tracking-widest mb-4">
            Command Center Divisions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Response Departments
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
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
                className={`group rounded-xl border border-white/5 bg-[#0A0A0A] transition-all duration-300 flex flex-col relative overflow-hidden ${dept.hoverShadow} ${dept.hoverBorder}`}
              >
                {/* Accent top border strip */}
                <div
                  className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: dept.color }}
                />

                <div className="p-8 flex flex-col flex-1">
                  {/* Icon Box */}
                  <div 
                    className="w-11 h-11 rounded-lg flex items-center justify-center border border-white/10 mb-6 transition-all duration-300 group-hover:scale-105"
                    style={{ 
                      color: dept.color, 
                      backgroundColor: `${dept.color}10`,
                    }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-white transition-colors">
                    {dept.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-white/50 leading-relaxed mb-6">
                    {dept.description}
                  </p>

                  {/* Handles list */}
                  <div className="mb-8 flex-1">
                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-3.5">
                      Core Operations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dept.handles.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors duration-300"
                          style={{
                            backgroundColor: `${dept.color}05`,
                            color: dept.color,
                            borderColor: `${dept.color}20`,
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
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-white transition-all w-full transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: dept.color,
                      boxShadow: `0 4px 15px ${dept.color}25`
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
