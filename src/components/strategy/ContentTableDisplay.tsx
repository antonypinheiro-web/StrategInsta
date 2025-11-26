import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Grid } from 'lucide-react';
import type { ContentTableData } from '@/types';

interface ContentTableDisplayProps {
  content: ContentTableData;
}

export const ContentTableDisplay: React.FC<ContentTableDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <Grid className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Matriz de Conteúdo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(content).map(([funnelStage, items]) => (
          <div key={funnelStage}>
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {funnelStage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Exemplo</TableHead>
                  <TableHead className="text-right">Frequência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.example}</TableCell>
                    <TableCell className="text-right">{item.frequency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};