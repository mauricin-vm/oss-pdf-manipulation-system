'use client'

//importar bibliotecas e funções
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';

//função principal
interface UserProfileProps {
  session: Session | null
};
const UserProfile: React.FC<UserProfileProps> = ({ session }) => {
  return (
    <div className="p-3 border-t bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {session?.user?.name || `Usuário`}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {session?.user?.email || ``}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: `/auth/signin` })}
          className="flex-shrink-0 px-6 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
        >
          Sair
        </Button>
      </div>
    </div>
  );
};
export { UserProfile };