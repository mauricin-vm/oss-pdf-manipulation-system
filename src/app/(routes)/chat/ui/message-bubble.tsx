'use client'

import { useCallback } from 'react';
import { Message } from '@/app/(routes)/chat/types/chat';
import { HiOutlineClock } from 'react-icons/hi';
import { BsCheckLg, BsCheckAll } from 'react-icons/bs';

interface AudioStates {
  [key: string]: { isPlaying: boolean; progress: number; audio?: HTMLAudioElement };
}

interface MessageBubbleProps {
  message: Message;
  audioStates: AudioStates;
  onAudioPlay: (messageId: string, audioBase64: string) => void;
  onAudioProgress: (e: React.MouseEvent<HTMLDivElement>, messageId: string) => void;
  onMediaModal: (isOpen: boolean, type: string, url: string) => void;
}

export function MessageBubble({
  message,
  audioStates,
  onAudioPlay,
  onAudioProgress,
  onMediaModal
}: MessageBubbleProps) {
  const formatWhatsAppMessage = (text: string) => {
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>'
      );
  };

  const getMessageStatus = (message: any) => {
    switch (message.ack) {
      case 0:
        return <HiOutlineClock className="text-gray-400 h-[0.8rem] w-[0.8rem] text-xs" />;
      case 1:
        return <BsCheckLg className="text-gray-400 h-[0.8rem] w-[0.8rem] text-xs" />;
      case 2:
        return <BsCheckAll className="text-gray-400 w-4 h-4 text-xs" />;
      case 3:
        return <BsCheckAll className="text-blue-500 w-4 h-4 text-xs" />;
      default:
        return <BsCheckLg className="text-gray-400 h-[0.8rem] w-[0.8rem] text-xs" />;
    }
  };

  const formatMessageTime = (timestamp: string | number) => {
    // Verificar se o timestamp é válido
    if (!timestamp || isNaN(timestamp as number)) {
      return '';
    }

    // Converter para número se necessário
    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

    // Verificar se é um timestamp válido
    if (isNaN(numTimestamp) || numTimestamp <= 0) {
      return '';
    }

    // Verificar se timestamp está em segundos ou milissegundos
    const timestampMs = numTimestamp.toString().length === 10 ? numTimestamp * 1000 : numTimestamp;
    const messageDate = new Date(timestampMs);

    // Verificar se a data é válida
    if (isNaN(messageDate.getTime())) {
      return '';
    }

    const today = new Date();

    // Resetar as horas para comparar apenas as datas
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Calcular ontem
    const yesterday = new Date(todayDay);
    yesterday.setDate(yesterday.getDate() - 1);

    // Se for de outro ano, mostra ano, mês, dia e hora
    return messageDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMediaContent = useCallback((message: Message) => {
    if (message.type === 'audio' || message.type === 'ptt') {
      return (
        <div className="flex items-center w-full gap-2 p-3 bg-gray-100 rounded-lg">
          <button
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors text-white"
            onClick={() => onAudioPlay(message.id, message.content)}
          >
            {audioStates[message.id]?.isPlaying ? '⏸️' : '▶️'}
          </button>

          <div className="flex flex-col gap-1 flex-1">
            <div
              className="relative w-full h-1 bg-gray-300 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => onAudioProgress(e, message.id)}
            >
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${audioStates[message.id]?.progress || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">Mensagem de Voz</span>
          </div>
        </div>
      );
    }

    if (message.type === 'image') {
      return (
        <div className="flex flex-col gap-2 w-48">
          <img
            src={`data:image/jpeg;base64,${message.content}`}
            alt="Imagem"
            className="w-full h-32 object-cover rounded-lg cursor-pointer"
            onClick={() => onMediaModal(true, 'image', `data:image/jpeg;base64,${message.content}`)}
          />
          <button
            className="flex items-center justify-center gap-2 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            onClick={() => onMediaModal(true, 'image', `data:image/jpeg;base64,${message.content}`)}
          >
            🔍 Ver Imagem
          </button>
        </div>
      );
    }

    if (message.type === 'video') {
      return (
        <div className="flex flex-col gap-2 w-48">
          <div className="relative">
            <video
              src={`data:video/mp4;base64,${message.content}`}
              className="w-full h-32 object-cover rounded-lg"
              controls={false}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
              <button
                className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center text-xl"
                onClick={() => onMediaModal(true, 'video', `data:video/mp4;base64,${message.content}`)}
              >
                ▶️
              </button>
            </div>
          </div>
          <button
            className="flex items-center justify-center gap-2 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            onClick={() => onMediaModal(true, 'video', `data:video/mp4;base64,${message.content}`)}
          >
            🎥 Reproduzir Vídeo
          </button>
        </div>
      );
    }

    if (message.type === 'document') {
      return (
        <div className="flex flex-col gap-2 min-w-48">
          <div className="p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <span className="text-sm font-medium text-gray-700">Documento</span>
            </div>
          </div>
          <button
            className="flex items-center justify-center gap-2 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `data:application/octet-stream;base64,${message.content}`;
              link.download = 'documento';
              link.click();
            }}
          >
            ⬇️ Baixar Documento
          </button>
        </div>
      );
    }

    return null;
  }, [audioStates, onAudioPlay, onAudioProgress, onMediaModal]);

  return (
    <div className={`flex ${message.fromMe ? 'justify-end mr-[1.5rem]' : 'justify-start ml-[1.5rem]'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm ${message.fromMe
          ? 'text-gray-900'
          : 'bg-white text-gray-900 border'
          }`}
        style={message.fromMe ? { backgroundColor: '#d9fdd3' } : {}}
      >
        {message.type && ['image', 'video', 'audio', 'ptt', 'document'].includes(message.type) ? (
          renderMediaContent(message)
        ) : (
          <div
            className="text-sm break-words whitespace-pre-wrap overflow-hidden"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            dangerouslySetInnerHTML={{
              __html: formatWhatsAppMessage(message.content)
            }}
          />
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">
            {formatMessageTime(message.timestamp)}
          </span>
          {message.fromMe && getMessageStatus(message)}
        </div>
      </div>
    </div>
  );
}