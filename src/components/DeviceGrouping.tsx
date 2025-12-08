import React from 'react';
import { Card } from './ui/card';
import { StockItem } from '../types';

interface DeviceGroupingProps {
  stock: StockItem[];
}

export default function DeviceGrouping({ stock }: DeviceGroupingProps) {
  // Pacemaker: Amvia Sky, Endicos, Enitra, Edora içerenler
  const pacemakerItems = stock.filter(item => {
    const name = item.materialName.toLowerCase();
    return name.includes('amvia sky') || 
           name.includes('endicos') || 
           name.includes('enitra') || 
           name.includes('edora');
  });

  // ICD: Pacemaker dışında VR-T ve DR-T içerenler
  const icdItems = stock.filter(item => {
    const name = item.materialName.toLowerCase();
    const isPacemaker = name.includes('amvia sky') || 
                        name.includes('endicos') || 
                        name.includes('enitra') || 
                        name.includes('edora');
    return !isPacemaker && (name.includes('vr-t') || name.includes('dr-t'));
  });

  // CRT: Bunlar dışında HF-T içerenler
  const crtItems = stock.filter(item => {
    const name = item.materialName.toLowerCase();
    const isPacemaker = name.includes('amvia sky') || 
                        name.includes('endicos') || 
                        name.includes('enitra') || 
                        name.includes('edora');
    const isICD = name.includes('vr-t') || name.includes('dr-t');
    return !isPacemaker && !isICD && name.includes('hf-t');
  });

  const pacemakerTotal = pacemakerItems.reduce((sum, item) => sum + item.quantity, 0);
  const icdTotal = icdItems.reduce((sum, item) => sum + item.quantity, 0);
  const crtTotal = crtItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-800">Pacemaker</p>
            <p className="text-slate-500">Amvia Sky, Endicos, Enitra, Edora</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            {pacemakerTotal} Adet
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-800">ICD</p>
            <p className="text-slate-500">VR-T, DR-T cihazları</p>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            {icdTotal} Adet
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-800">CRT</p>
            <p className="text-slate-500">HF-T cihazları</p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
            {crtTotal} Adet
          </div>
        </div>
      </Card>
    </div>
  );
}
