import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, FileArchive } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import api from '@/services/api';

interface BulkImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface ImportData {
    full_name: string;
    phone: string;
    email: string;
    role_code: string;
    base_salary: number;
}

interface ImportReport {
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
}

export default function BulkImportSheet({ open, onOpenChange, onSuccess }: BulkImportSheetProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<ImportReport | null>(null);

    const mapRoleCode = (vietnameseRole: string): string => {
        const role = vietnameseRole?.toLowerCase().trim();
        if (role?.includes('quản lý') || role?.includes('manager')) return 'MANAGER';
        if (role?.includes('kho') || role?.includes('warehouse')) return 'STAFF_INVENTORY';
        if (role?.includes('thu ngân') || role?.includes('pos') || role?.includes('bán hàng')) return 'STAFF_POS';
        return 'STAFF_POS'; // Default
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setReport(null);

        // Check if ZIP and skip parsing
        if (selectedFile.name.endsWith('.zip') || selectedFile.type.includes('zip') || selectedFile.type.includes('compressed')) {
            setPreviewData([]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Map fields
                const mappedData: ImportData[] = jsonData.map((row: any) => ({
                    full_name: row['Tên'] || row['Name'] || '',
                    phone: row['Số điện thoại']?.toString() || row['Phone']?.toString() || '',
                    email: row['Email'] || '',
                    role_code: mapRoleCode(row['Role'] || row['Chức vụ'] || ''),
                    base_salary: Number(row['Lương'] || row['Salary'] || 0)
                })).filter(item => item.email && item.phone); // Basic filter

                setPreviewData(mappedData);
            } catch (error) {
                console.error("Parse Error:", error);
                toast({ title: "Error", description: "Failed to parse Excel file", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(selectedFile);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip']
        },
        maxFiles: 1
    });

    const isZip = file?.name.endsWith('.zip');

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);

        try {
            let res;
            if (isZip) {
                // ZIP: Direct Upload
                const formData = new FormData();
                formData.append('file', file);
                res = await api.post('/users/import-zip', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // EXCEL: Regular JSON Import
                if (previewData.length === 0) return;
                res = await api.post('/employees/import', previewData);
            }

            setReport(res.data);
            
            if (res.data.success > 0) {
                toast({ 
                    title: "Import Success", 
                    description: `Successfully imported ${res.data.success} employees.` 
                });
                onSuccess();
            } else {
                 toast({ 
                    title: "Import Failed", 
                    description: "No employees were imported.",
                    variant: "destructive"
                });
            }

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to upload data", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full">
                <SheetHeader>
                    <SheetTitle>Bulk Import Employees</SheetTitle>
                    <SheetDescription>
                        Upload Excel (.xlsx) or ZIP file (Excel + Images).
                        <br />
                        Columns: Tên, Số điện thoại, Email, Role, Lương, Avatar File (ZIP only).
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Dropzone */}
                    {!file && !report && (
                        <div 
                            {...getRootProps()} 
                            className={`
                                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                                ${isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2">
                                <FileSpreadsheet className="h-10 w-10 text-neutral-400" />
                                <p className="text-sm font-medium text-neutral-600">
                                    {isDragActive ? "Drop file here" : "Drag & drop Excel or ZIP file"}
                                </p>
                                <p className="text-xs text-neutral-400">.xlsx, .xls, .zip</p>
                            </div>
                        </div>
                    )}

                    {/* File Preview */}
                    {file && !report && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded flex items-center justify-center ${isZip ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                        {isZip ? <FileArchive className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900">{file.name}</p>
                                        <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB • {isZip ? 'ZIP Archive' : `${previewData.length} rows`}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreviewData([]); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Show Table ONLY if NOT ZIP */}
                            {!isZip && (
                                <ScrollArea className="h-[300px] rounded-md border text-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Full Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-right">Salary</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{row.full_name}</TableCell>
                                                    <TableCell>{row.email}</TableCell>
                                                    <TableCell>{row.role_code}</TableCell>
                                                    <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(row.base_salary)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}

                            {isZip && (
                                <div className="p-4 bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex gap-3 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Ready to upload ZIP archive</p>
                                        <p>The system will extract the Excel file and map avatar images automatically. Please ensure "Avatar File" column matches filenames exactly.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => { setFile(null); setPreviewData([]); }}>Cancel</Button>
                                <Button onClick={handleUpload} disabled={isLoading}>
                                    {isLoading ? "Importing..." : "Run Import"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Report */}
                    {report && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-bold text-green-700">{report.success} Success</p>
                                        <p className="text-xs text-green-600">Employees created</p>
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <p className="text-sm font-bold text-red-700">{report.failed} Failed</p>
                                        <p className="text-xs text-red-600">Errors encountered</p>
                                    </div>
                                </div>
                            </div>

                            {report.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Error Details</h4>
                                    <ScrollArea className="h-[200px] border rounded-md p-2 bg-neutral-50">
                                        <table className="w-full text-xs text-left">
                                            <tbody>
                                                {report.errors.map((err, i) => (
                                                    <tr key={i} className="border-b border-neutral-200 last:border-0">
                                                        <td className="py-2 px-2 font-medium w-[80px]">Row {err.row}</td>
                                                        <td className="py-2 px-2 text-red-600">{err.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </ScrollArea>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={() => { setReport(null); setFile(null); setPreviewData([]); onSuccess(); }}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
