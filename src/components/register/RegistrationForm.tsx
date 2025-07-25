
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from 'next/image';
import { CheckCircle2, PartyPopper, Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParticipants } from "@/lib/data";

const ageRanges = ["20-29 ปี", "30-39 ปี", "40-49 ปี", "50-59 ปี", "60-69 ปี", "70+ ปี"] as const;

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female"], {
    required_error: "กรุณาเลือกเพศ",
  }),
  ageRange: z.enum(ageRanges, {
    required_error: "กรุณาเลือกช่วงอายุ",
  }),
  phone: z.string().optional(),
  email: z.string().optional(),
  lineId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.firstName?.trim() && !data.lastName?.trim() && !data.nickname?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "กรุณากรอกชื่อ, นามสกุล หรือชื่อเล่นอย่างน้อยหนึ่งช่อง",
      path: ["firstName"],
    });
  }

  if (!data.phone?.trim() && !data.email?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "กรุณากรอกเบอร์โทรศัพท์หรืออีเมลอย่างน้อยหนึ่งช่อง",
      path: ["phone"],
    });
  }

  if (data.phone && !/^(0\d{9})$/.test(data.phone)) {
    ctx.addIssue({
      path: ["phone"],
      message: "กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง",
      code: z.ZodIssueCode.custom,
    });
  }
  
  if (data.email && !z.string().email({ message: "กรุณากรอกอีเมลให้ถูกต้อง" }).safeParse(data.email).success) {
    ctx.addIssue({
      path: ["email"],
      message: "กรุณากรอกอีเมลให้ถูกต้อง",
      code: z.ZodIssueCode.custom,
    });
  }
});


export function RegistrationForm() {
  const { toast } = useToast();
  const { addParticipant } = useParticipants();
  const [submissionResult, setSubmissionResult] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      phone: "",
      email: "",
      lineId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const nameParts = [values.firstName, values.lastName].filter(p => p && p.trim()).map(p => p!.trim());
      let displayName = nameParts.join(" ");

      if (values.nickname && values.nickname.trim()) {
        const trimmedNickname = values.nickname.trim();
        displayName = displayName ? `${displayName} (${trimmedNickname})` : trimmedNickname;
      }

      const newId = await addParticipant({
        name: displayName,
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname,
        gender: values.gender,
        ageRange: values.ageRange,
        phone: values.phone,
        email: values.email,
        lineId: values.lineId,
      });
      
      setSubmissionResult({ id: newId, name: displayName });
      
      toast({
        title: "ลงทะเบียนสำเร็จ!",
        description: `ผู้เล่นใหม่ '${displayName}' ถูกเพิ่มในระบบแล้ว`,
      });
      
      form.reset();
    } catch (error) {
      console.error("Registration failed:", error);
      // The error toast is handled in the useParticipants hook
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRegisterAnother = () => {
    setSubmissionResult(null);
  }

  if (submissionResult) {
    return (
        <Card className="w-full shadow-2xl text-center animate-pop-in">
            <CardHeader>
                 <div className="mx-auto bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full p-4 w-fit mb-4">
                    <PartyPopper className="h-10 w-10"/>
                </div>
                <CardTitle className="font-headline text-3xl text-primary">ลงทะเบียนสำเร็จ!</CardTitle>
                <CardDescription className="text-base pt-2">
                    ยินดีต้อนรับ!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="bg-secondary/80 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">ชื่อผู้เล่น:</p>
                    <p className="text-xl font-semibold text-foreground py-1">{submissionResult.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">รหัสผู้เล่นของคุณคือ:</p>
                    <p className="text-4xl font-bold font-mono tracking-widest text-accent py-2">{submissionResult.id}</p>
                    <p className="text-xs text-muted-foreground">กรุณาแจ้งรหัสนี้แก่เจ้าหน้าที่ในแต่ละฐาน</p>
                </div>
                
                 <Button onClick={handleRegisterAnother} size="lg" className="w-full">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    ลงทะเบียนคนถัดไป
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="items-center text-center">
        <Image src="https://www.genfosis.com/images/Genfosis_Logo_PNG.webp" alt="Genfosis Logo" width={100} height={159} priority className="mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">ลงทะเบียนเข้าร่วมกิจกรรม</CardTitle>
      
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อจริง</FormLabel>
                    <FormControl>
                      <Input placeholder="โปรดกรอกชื่อของคุณ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>นามสกุล</FormLabel>
                    <FormControl>
                      <Input placeholder="โปรดกรอกนามสกุลของคุณ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อเล่น (หากไม่สะดวกกรอกชื่อจริง)</FormLabel>
                    <FormControl>
                      <Input placeholder="โปรดกรอกชื่อเล่นของคุณ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>เพศ</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="male" />
                        </FormControl>
                        <FormLabel className="font-normal">ชาย</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel className="font-normal">หญิง</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ช่วงอายุ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="กรุณาเลือกช่วงอายุของคุณ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ageRanges.map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <p className="text-sm font-medium">กรุณากรอกเบอร์โทรศัพท์หรืออีเมล</p>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทรศัพท์</FormLabel>
                    <FormControl>
                      <Input placeholder="0812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
              
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <FormField
                control={form.control}
                name="lineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LINE ID (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="yourlineid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
