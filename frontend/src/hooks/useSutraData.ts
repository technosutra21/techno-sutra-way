import { useState, useEffect } from 'react';
import { SutraData, Character, CharacterEN, Chapter, ChapterEN, CombinedSutraEntry } from '@/types/sutra';

// CSV parsing utility
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Get headers from first line
  const headers = lines[0].split(',').map(header => 
    header.replace(/^"/, '').replace(/"$/, '').trim()
  );
  
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line with proper quote handling
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          j++; // Skip next quote
        } else {
          // Start or end of quoted value
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    // Create object from headers and values
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    
    data.push(entry);
  }
  
  return data;
};

// Map CSV data to our interfaces
const mapCharacterData = (csvData: any[]): Character[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    capitulo: parseInt(row.capitulo || '0'),
    nome: row.Nome || '',
    ensinamento: row.Ensinamento || '',
    descPersonagem: row['Desc. Personagem'] || '',
    ocupacao: (row['Ocupação'] || row.Ocupacao) || '',
    significado: row.Significado || '',
    local: row.Local || '',
    resumoCap: row['Resumo do Cap. (84000.co)'] || '',
    capFileName: row['Cap. FILE NAME'] || '',
    capUrl: row['Cap. URL'] || '',
    qrCodeUrl: row['QR Code URL'] || '',
    linkModel: row['LINK MODEL'] || ''
  }));
};

const mapCharacterENData = (csvData: any[]): CharacterEN[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    name: row.Name || '',
    teaching: row.Teaching || '',
    characterDesc: row['Character Desc'] || '',
    occupation: row.Occupation || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    chapterSummary: row['Chapter Summary'] || '',
    capFileName: row['Cap. FILE NAME'] || '',
    capUrl: row['Cap. URL'] || '',
    qrCodeUrl: row['QR Code URL'] || '',
    linkModel: row['LINK MODEL'] || ''
  }));
};

const mapChapterData = (csvData: any[]): Chapter[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    character: row.Character || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    encounter: row.Encounter || '',
    assembly: row.Assembly || '',
    dialogue: row.Dialogue || '',
    teaching: row.Teaching || '',
    manifestation: row.Manifestation || '',
    learning: row.Learning || '',
    direction: row.Direction || '',
    literaryStructure: row['Literary Structure'] || ''
  }));
};

const mapChapterENData = (csvData: any[]): ChapterEN[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    character: row.Character || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    encounter: row.Encounter || '',
    assembly: row.Assembly || '',
    dialogue: row.Dialogue || '',
    teaching: row.Teaching || '',
    manifestation: row.Manifestation || '',
    learning: row.Learning || '',
    direction: row.Direction || '',
    literaryStructure: row['Literary Structure'] || ''
  }));
};

export const useSutraData = () => {
  const [data, setData] = useState<SutraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setLoading(true);
        
        // Load all CSV files
        const [charactersResponse, charactersENResponse, chaptersResponse, chaptersENResponse] = await Promise.all([
          fetch('/characters.csv'),
          fetch('/characters_en.csv'),
          fetch('/chapters.csv'),
          fetch('/chapters_en.csv')
        ]);

        if (!charactersResponse.ok || !charactersENResponse.ok || !chaptersResponse.ok || !chaptersENResponse.ok) {
          throw new Error('Failed to load CSV files');
        }

        const [charactersText, charactersENText, chaptersText, chaptersENText] = await Promise.all([
          charactersResponse.text(),
          charactersENResponse.text(),
          chaptersResponse.text(),
          chaptersENResponse.text()
        ]);

        // Parse CSV data
        const charactersCSV = parseCSV(charactersText);
        const charactersENCSV = parseCSV(charactersENText);
        const chaptersCSV = parseCSV(chaptersText);
        const chaptersENCSV = parseCSV(chaptersENText);

        // Map to interfaces
        const characters = mapCharacterData(charactersCSV);
        const charactersEN = mapCharacterENData(charactersENCSV);
        const chapters = mapChapterData(chaptersCSV);
        const chaptersEN = mapChapterENData(chaptersENCSV);

        setData({
          characters,
          charactersEN,
          chapters,
          chaptersEN
        });

        console.log('Sutra data loaded successfully:', {
          characters: characters.length,
          charactersEN: charactersEN.length,
          chapters: chapters.length,
          chaptersEN: chaptersEN.length
        });

      } catch (err) {
        console.error('Error loading CSV data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Utility function to combine character and chapter data
  const getCombinedData = (language: 'pt' | 'en' = 'pt'): CombinedSutraEntry[] => {
    if (!data) return [];

    const characters = language === 'pt' ? data.characters : data.charactersEN;
    const chapters = language === 'pt' ? data.chapters : data.chaptersEN;

    return characters.map(char => {
      const chapter = chapters.find(ch => ch.chapter === (language === 'pt' ? char.capitulo : char.chapter));
      
      if (language === 'pt') {
        const ptChar = char as Character;
        return {
          id: ptChar.id,
          chapter: ptChar.capitulo,
          nome: ptChar.nome,
          name: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.name || ptChar.nome,
          ocupacao: ptChar.ocupacao,
          occupation: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.occupation || ptChar.ocupacao,
          significado: ptChar.significado,
          meaning: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.meaning || ptChar.significado,
          local: ptChar.local,
          location: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.location || ptChar.local,
          ensinamento: ptChar.ensinamento,
          teaching: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.teaching || ptChar.ensinamento,
          descPersonagem: ptChar.descPersonagem,
          characterDesc: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.characterDesc || ptChar.descPersonagem,
          resumoCap: ptChar.resumoCap,
          chapterSummary: data.charactersEN.find(c => c.chapter === ptChar.capitulo)?.chapterSummary || ptChar.resumoCap,
          linkModel: ptChar.linkModel,
          capUrl: ptChar.capUrl,
          qrCodeUrl: ptChar.qrCodeUrl,
          encounter: chapter?.encounter,
          assembly: chapter?.assembly,
          dialogue: chapter?.dialogue,
          manifestation: chapter?.manifestation,
          learning: chapter?.learning,
          direction: chapter?.direction,
          literaryStructure: chapter?.literaryStructure
        };
      } else {
        const enChar = char as CharacterEN;
        return {
          id: enChar.id,
          chapter: enChar.chapter,
          nome: data.characters.find(c => c.capitulo === enChar.chapter)?.nome || enChar.name,
          name: enChar.name,
          ocupacao: data.characters.find(c => c.capitulo === enChar.chapter)?.ocupacao || enChar.occupation,
          occupation: enChar.occupation,
          significado: data.characters.find(c => c.capitulo === enChar.chapter)?.significado || enChar.meaning,
          meaning: enChar.meaning,
          local: data.characters.find(c => c.capitulo === enChar.chapter)?.local || enChar.location,
          location: enChar.location,
          ensinamento: data.characters.find(c => c.capitulo === enChar.chapter)?.ensinamento || enChar.teaching,
          teaching: enChar.teaching,
          descPersonagem: data.characters.find(c => c.capitulo === enChar.chapter)?.descPersonagem || enChar.characterDesc,
          characterDesc: enChar.characterDesc,
          resumoCap: data.characters.find(c => c.capitulo === enChar.chapter)?.resumoCap || enChar.chapterSummary,
          chapterSummary: enChar.chapterSummary,
          linkModel: enChar.linkModel,
          capUrl: enChar.capUrl,
          qrCodeUrl: enChar.qrCodeUrl,
          encounter: chapter?.encounter,
          assembly: chapter?.assembly,
          dialogue: chapter?.dialogue,
          manifestation: chapter?.manifestation,
          learning: chapter?.learning,
          direction: chapter?.direction,
          literaryStructure: chapter?.literaryStructure
        };
      }
    }).sort((a, b) => a.chapter - b.chapter);
  };

  const getCharacterByChapter = (chapterNumber: number, language: 'pt' | 'en' = 'pt'): CombinedSutraEntry | undefined => {
    return getCombinedData(language).find(entry => entry.chapter === chapterNumber);
  };

  return {
    data,
    loading,
    error,
    getCombinedData,
    getCharacterByChapter
  };
};