import { useState, useRef } from 'react';

const ADC_MAX = 1023.0; // si tu Arduino manda hasta 4095, cambiar por 4095.0

export const useWebSerial = () => {
  const [rawValues, setRawValues] = useState({ a: 0, b: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const readerRef = useRef(null);

  const connectSerial = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setIsConnected(true);

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      readerRef.current = decoder.readable.getReader();

      let buffer = "";

      while (true) {
        const { value, done } = await readerRef.current.read();
        if (done) break;

        buffer += value;

        if (buffer.length > 150) buffer = buffer.slice(-70);

        if (buffer.includes("\n")) {
          const lines = buffer.split("\n");
          const lastLine = lines[lines.length - 2];
          buffer = lines[lines.length - 1];

          if (lastLine) {
            const cleanLine = lastLine.trim();

            console.log("SERIAL RAW:", cleanLine);

            const match = cleanLine.match(/^(\d+)[,.](\d+)$/);
            if (!match) {
              console.warn("Formato serial inválido:", cleanLine);
              continue;
            }

            const rawA = Number(match[1]);
            const rawB = Number(match[2]);

            const valA = Math.min(1, Math.max(0, rawA / ADC_MAX));
            const valB = Math.min(1, Math.max(0, rawB / ADC_MAX));

            console.log("SERIAL PARSED:", {
              rawA,
              rawB,
              valA,
              valB
            });

            setRawValues(prev => {
              const finalA = valA > prev.a ? (prev.a * 0.5 + valA * 0.5) : valA;
              const finalB = valB > prev.b ? (prev.b * 0.5 + valB * 0.5) : valB;

              return {
                a: finalA < 0.02 ? 0 : finalA,
                b: finalB < 0.02 ? 0 : finalB
              };
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      setIsConnected(false);
    }
  };

  return { rawValues, isConnected, connectSerial };
};