interface OrganizationDisplayProps {
  tenantName: string;
  tenantDomain: string;
  role: string;
}

export function OrganizationDisplay({
  tenantName,
  tenantDomain,
  role,
}: OrganizationDisplayProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{tenantName}</p>
        <p className="text-xs text-gray-600">{tenantDomain}</p>
      </div>
      <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded capitalize">
        {role}
      </div>
    </div>
  );
}
